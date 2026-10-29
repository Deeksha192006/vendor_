import mongoose from 'mongoose';
import { Settings } from '../src/models/Settings.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Cart } from '../src/models/Cart.js';
import { Order } from '../src/models/Order.js';
import { fairCoinService } from '../src/services/fairCoinService.js';
import { orderService } from '../src/services/orderService.js';
import { cartService } from '../src/services/cartService.js';
import { priceService } from '../src/services/priceService.js';
import { FAIR_COIN_CONVERSION } from '../src/constants/coinConstants.js';

import { connectDB } from '../src/config/db.js';

async function runTests() {
  console.log('🧪 Starting Fair Coins Per-Purchase Usage Limit Test Suite...\n');
  await connectDB();

  try {
    // Setup test users
    const adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) throw new Error('Super admin user not found');

    let customer = await User.findOne({ email: 'user@fairkart.dev' });
    if (!customer) {
      throw new Error('Customer user@fairkart.dev not found');
    }
    customer.fairCoinBalance = 200;
    await customer.save();

    // Get an active product (or create a test one)
    let product = await Product.findOne({ status: 'APPROVED', isDeleted: false, stock: { $gte: 5 } });
    if (!product) {
      product = await Product.create({
        name: 'Test Indian Silk Saree',
        slug: `test-saree-${Date.now()}`,
        sku: `SKU-${Date.now()}`,
        description: 'Traditional saree',
        price: 2500,
        sellingPrice: 2500,
        stock: 50,
        category: 'Apparel',
        status: 'APPROVED',
        sourceType: 'SUPER_ADMIN',
      });
    }

    const testAddress = {
      name: 'Test Customer',
      phone: '9876543210',
      streetAddress: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    };

    // Test Case 1: Super Admin sets maximum to 100 Fair Coins
    console.log('--- Test 1: Super Admin sets maximum to 100 Fair Coins ---');
    await Settings.findOneAndUpdate(
      { key: 'MAX_FAIR_COINS_PER_PURCHASE' },
      { key: 'MAX_FAIR_COINS_PER_PURCHASE', value: 100, category: 'FAIR_COINS', updatedBy: adminUser._id },
      { upsert: true, new: true }
    );
    const limit1 = await fairCoinService.getMaxCoinsPerPurchase();
    console.log(`Configured Limit: ${limit1}`);
    if (limit1 !== 100) throw new Error(`Expected 100, got ${limit1}`);
    console.log('✅ Test 1 Passed: Limit successfully set to 100.\n');

    // Setup Cart with product
    const pricing = priceService.getEffectiveProductPrice(product);
    let cart = await Cart.findOne({ userId: customer._id });
    if (!cart) cart = await Cart.create({ userId: customer._id, items: [] });
    cart.items = [{
      productId: product._id,
      quantity: 1,
      price: pricing.sellingPrice,
    }];
    await cart.save();

    // Verify customer cart and wallet endpoints return the limit
    const cartData = await cartService.getCart(customer._id);
    const walletData = await fairCoinService.getOrCreateWallet(customer._id);
    console.log(`Cart maxCoinsPerPurchase: ${cartData.maxCoinsPerPurchase}`);
    console.log(`Wallet maxCoinsPerPurchase: ${walletData.maxCoinsPerPurchase}`);
    if (cartData.maxCoinsPerPurchase !== 100 || walletData.maxCoinsPerPurchase !== 100) {
      throw new Error('Endpoints did not return configured limit 100');
    }
    console.log('✅ Endpoints return current limit: 100.\n');

    // Test Case 2: Customer with 200 Fair Coins attempts to redeem 200
    console.log('--- Test 2: Customer attempts to redeem 200 when limit is 100 ---');
    try {
      await orderService.createOrder(customer._id, {
        shippingAddress: testAddress,
        paymentMethod: 'COD',
        fairCoinsToRedeem: 200,
      });
      throw new Error('Order creation should have failed for 200 coins');
    } catch (err) {
      console.log(`Expected rejection message: "${err.message}"`);
      if (!err.message.includes('You can use only 100 Fair Coins per purchase')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      console.log('✅ Test 2 Passed: Request correctly rejected with: ' + err.message + '\n');
    }

    // Test Case 3: Customer redeems exactly 100 Fair Coins
    console.log('--- Test 3: Customer redeems exactly 100 Fair Coins ---');
    // Ensure product stock in cart
    await Cart.findOneAndUpdate({ userId: customer._id }, {
      $set: { items: [{ productId: product._id, quantity: 1, price: pricing.sellingPrice }] }
    });
    const order3 = await orderService.createOrder(customer._id, {
      shippingAddress: testAddress,
      paymentMethod: 'COD',
      fairCoinsToRedeem: 100,
    });
    console.log(`Order created: #${order3.orderNumber}`);
    console.log(`Subtotal: ₹${order3.subtotal}, Coins Used: ${order3.fairCoinsUsed}, Coin Discount: ₹${order3.coinDiscount}, Grand Total: ₹${order3.total}`);
    if (order3.fairCoinsUsed !== 100) throw new Error(`Expected 100 coins used, got ${order3.fairCoinsUsed}`);
    if (order3.coinDiscount !== 10) throw new Error(`Expected ₹10 discount (100 coins / 10), got ${order3.coinDiscount}`);
    
    // Check updated customer balance (200 - 100 = 100)
    const updatedCustomer = await User.findById(customer._id);
    console.log(`Customer remaining Fair Coins: ${updatedCustomer.fairCoinBalance}`);
    if (updatedCustomer.fairCoinBalance !== 100) {
      throw new Error(`Expected 100 remaining coins, got ${updatedCustomer.fairCoinBalance}`);
    }
    console.log('✅ Test 3 Passed: 100 coins redeemed, ₹10 discount applied, total correctly updated.\n');

    // Test Case 4: Customer with 50 coins attempts to redeem 100
    console.log('--- Test 4: Customer with 50 coins attempts to redeem 100 ---');
    updatedCustomer.fairCoinBalance = 50;
    await updatedCustomer.save();

    await Cart.findOneAndUpdate({ userId: customer._id }, {
      $set: { items: [{ productId: product._id, quantity: 1, price: pricing.sellingPrice }] }
    });

    try {
      await orderService.createOrder(customer._id, {
        shippingAddress: testAddress,
        paymentMethod: 'COD',
        fairCoinsToRedeem: 100,
      });
      throw new Error('Order creation should have failed for insufficient balance');
    } catch (err) {
      console.log(`Expected rejection message: "${err.message}"`);
      if (!err.message.includes('available balance of 50 Fair Coins')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      console.log('✅ Test 4 Passed: Request correctly rejected for insufficient balance.\n');
    }

    // Test Case 5: Super Admin changes limit from 100 to 50
    console.log('--- Test 5: Super Admin updates limit from 100 to 50 ---');
    await Settings.findOneAndUpdate(
      { key: 'MAX_FAIR_COINS_PER_PURCHASE' },
      { key: 'MAX_FAIR_COINS_PER_PURCHASE', value: 50, category: 'FAIR_COINS', updatedBy: adminUser._id },
      { upsert: true, new: true }
    );
    const limit5 = await fairCoinService.getMaxCoinsPerPurchase();
    console.log(`New Configured Limit: ${limit5}`);
    if (limit5 !== 50) throw new Error(`Expected 50, got ${limit5}`);

    const newCartData = await cartService.getCart(customer._id);
    if (newCartData.maxCoinsPerPurchase !== 50) {
      throw new Error(`Expected cart to reflect 50, got ${newCartData.maxCoinsPerPurchase}`);
    }
    console.log('✅ Test 5 Passed: Customer side immediately reflects the new limit of 50.\n');

    // Test Case 6: Direct API bypass attempt (attempting to redeem 75 when limit is 50)
    console.log('--- Test 6: Direct API bypass attempt (75 coins when limit is 50) ---');
    updatedCustomer.fairCoinBalance = 200;
    await updatedCustomer.save();

    await Cart.findOneAndUpdate({ userId: customer._id }, {
      $set: { items: [{ productId: product._id, quantity: 1, price: pricing.sellingPrice }] }
    });

    try {
      await orderService.createOrder(customer._id, {
        shippingAddress: testAddress,
        paymentMethod: 'COD',
        fairCoinsToRedeem: 75,
      });
      throw new Error('Backend should have rejected direct request for 75 coins');
    } catch (err) {
      console.log(`Backend rejection message: "${err.message}"`);
      if (!err.message.includes('You can use only 50 Fair Coins per purchase')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      console.log('✅ Test 6 Passed: Backend reliably rejected bypass attempt.\n');
    }

    // Test Case 7: Reset limit to 100 and verify conversion rate
    console.log('--- Test 7: Conversion rate and existing functionality intact ---');
    await Settings.findOneAndUpdate(
      { key: 'MAX_FAIR_COINS_PER_PURCHASE' },
      { key: 'MAX_FAIR_COINS_PER_PURCHASE', value: 100, category: 'FAIR_COINS', updatedBy: adminUser._id },
      { upsert: true, new: true }
    );
    const rate = FAIR_COIN_CONVERSION.COINS_PER_RUPEE;
    console.log(`Conversion rate: ${rate} Fair Coins = ₹1`);
    if (rate !== 10) throw new Error(`Expected 10, got ${rate}`);
    console.log('✅ Test 7 Passed: Conversion rate permanently preserved at 10 Fair Coins = ₹1.\n');

    console.log('🎉 ALL 7 TESTS PASSED SUCCESSFULLY! 🚀');
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
