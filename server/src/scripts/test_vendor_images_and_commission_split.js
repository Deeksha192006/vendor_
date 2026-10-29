import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Category } from '../models/Category.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { productService } from '../services/productService.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { orderService } from '../services/orderService.js';
import { moneyUtils } from '../utils/moneyUtils.js';

async function runTests() {
  console.log('================================================================');
  console.log('BAAPOO MART - VENDOR IMAGES & 5% COMMISSION SPLIT VERIFICATION');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Database connected successfully.\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: PART A - VENDOR PRODUCT IMAGE VALIDATION
    // -------------------------------------------------------------
    console.log('--- TEST SUITE 1: Vendor Product Image Management (Up to 5 Images) ---');

    // 1.1 Exceeding 5 images must fail
    try {
      const sixImages = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/vuUAAA=',
        'https://example.com/img4.jpg',
        'https://example.com/img5.png',
        'https://example.com/img6.webp'
      ];
      productService.validateProductImages(sixImages);
      assert(false, 'Expected validation to reject more than 5 images');
    } catch (err) {
      assert(err.message.includes('maximum of 5 images'), 'Rejects > 5 images with clear message');
    }

    // 1.2 Invalid format (e.g. GIF or PDF) must fail
    try {
      const invalidFormat = ['data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'];
      productService.validateProductImages(invalidFormat);
      assert(false, 'Expected validation to reject unsupported format (GIF)');
    } catch (err) {
      assert(err.message.includes('JPEG, PNG, and WebP'), 'Rejects unsupported image format (GIF)');
    }

    // 1.3 Valid images (1 to 5, JPEG/PNG/WebP/HTTP URL) must pass
    const validImages = [
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/vuUAAA=',
      'https://example.com/product-primary.jpg',
      'https://example.com/product-angle2.webp'
    ];
    const cleaned = productService.validateProductImages(validImages);
    assert(cleaned.length === 5, 'Accepts up to 5 valid JPEG, PNG, WebP images');

    // -------------------------------------------------------------
    // TEST SUITE 2: PART B & C - 5% COMMISSION & EXACT ₹11,000 EXAMPLE
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: Fixed 5% Commission & ₹11,000 Reconciliation Example ---');

    // Clean up test fixtures from previous runs
    await Product.deleteMany({ sku: { $in: ['TEST-SKU-A', 'TEST-SKU-B', 'TEST-SKU-C', 'TEST-SKU-D'] } });
    await Order.deleteMany({ 'shippingAddress.fullName': 'Test Commission Customer' });

    // Find or create test customer user
    let customerUser = await User.findOne({ email: 'testcustomer@baapoomart.com' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Test Customer',
        email: 'testcustomer@baapoomart.com',
        phone: '9999900001',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'CUSTOMER'
      });
    }

    // Find or create Vendors
    async function getOrCreateVendor(index, name) {
      let vUser = await User.findOne({ email: `vendor${index}@baapoomart.com` });
      if (!vUser) {
        vUser = await User.create({
          name,
          email: `vendor${index}@baapoomart.com`,
          phone: `999990001${index}`,
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          role: 'VENDOR'
        });
      }
      let vendor = await Vendor.findOne({ userId: vUser._id });
      if (!vendor) {
        vendor = await Vendor.create({
          userId: vUser._id,
          storeName: `${name} Store`,
          slug: `vendor-${index}-store`,
          email: vUser.email,
          phone: vUser.phone,
          status: 'APPROVED',
          isApproved: true,
          commissionRate: 5,
          walletBalance: 0,
          pendingSettlementBalance: 0
        });
      }
      return vendor;
    }

    const vendor1 = await getOrCreateVendor(1, 'Vendor 1');
    const vendor2 = await getOrCreateVendor(2, 'Vendor 2');
    const vendor3 = await getOrCreateVendor(3, 'Vendor 3');

    let testCategory = await Category.findOne({ slug: 'test-electronics' });
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Test Electronics',
        slug: 'test-electronics',
        isActive: true
      });
    }

    // Create 4 products:
    // Product A (Vendor 1): Selling Price = ₹1,000
    // Product B (Vendor 2): Selling Price = ₹2,000
    // Product C (Vendor 3): Selling Price = ₹3,000
    // Product D (Vendor 2): Selling Price = ₹5,000
    const prodA = await Product.create({
      name: 'Product A',
      slug: 'test-product-a',
      sku: 'TEST-SKU-A',
      categoryId: testCategory._id,
      vendorId: vendor1._id,
      price: 1000,
      mrp: 1200,
      stock: 50,
      isActive: true,
      status: 'APPROVED',
      images: [validImages[0], validImages[1]]
    });
    const prodB = await Product.create({
      name: 'Product B',
      slug: 'test-product-b',
      sku: 'TEST-SKU-B',
      categoryId: testCategory._id,
      vendorId: vendor2._id,
      price: 2000,
      mrp: 2500,
      stock: 50,
      isActive: true,
      status: 'APPROVED',
      images: [validImages[1]]
    });
    const prodC = await Product.create({
      name: 'Product C',
      slug: 'test-product-c',
      sku: 'TEST-SKU-C',
      categoryId: testCategory._id,
      vendorId: vendor3._id,
      price: 3000,
      mrp: 3500,
      stock: 50,
      isActive: true,
      status: 'APPROVED',
      images: [validImages[2]]
    });
    const prodD = await Product.create({
      name: 'Product D',
      slug: 'test-product-d',
      sku: 'TEST-SKU-D',
      categoryId: testCategory._id,
      vendorId: vendor2._id,
      price: 5000,
      mrp: 6000,
      stock: 50,
      isActive: true,
      status: 'APPROVED',
      images: [validImages[3]]
    });

    console.log('Created test products:');
    console.log(`- Product A: ₹${prodA.price} (Vendor 1, ${prodA.images.length} images)`);
    console.log(`- Product B: ₹${prodB.price} (Vendor 2, ${prodB.images.length} image)`);
    console.log(`- Product C: ₹${prodC.price} (Vendor 3, ${prodC.images.length} image)`);
    console.log(`- Product D: ₹${prodD.price} (Vendor 2, ${prodD.images.length} image)`);

    // 2.1 Test Line-by-Line 5% Calculation
    const calcA = platformCommissionService.calculateLine(1000, 1);
    const calcB = platformCommissionService.calculateLine(2000, 1);
    const calcC = platformCommissionService.calculateLine(3000, 1);
    const calcD = platformCommissionService.calculateLine(5000, 1);

    assert(calcA.platformCommission === 50 && calcA.vendorProceeds === 950, 'Product A: ₹1,000 -> 5% commission = ₹50, Vendor proceeds = ₹950');
    assert(calcB.platformCommission === 100 && calcB.vendorProceeds === 1900, 'Product B: ₹2,000 -> 5% commission = ₹100, Vendor proceeds = ₹1,900');
    assert(calcC.platformCommission === 150 && calcC.vendorProceeds === 2850, 'Product C: ₹3,000 -> 5% commission = ₹150, Vendor proceeds = ₹2,850');
    assert(calcD.platformCommission === 250 && calcD.vendorProceeds === 4750, 'Product D: ₹5,000 -> 5% commission = ₹250, Vendor proceeds = ₹4,750');

    // 2.2 Place Order with Cart
    await Cart.findOneAndUpdate(
      { userId: customerUser._id },
      {
        userId: customerUser._id,
        items: [
          { productId: prodA._id, quantity: 1, price: 1000 },
          { productId: prodB._id, quantity: 1, price: 2000 },
          { productId: prodC._id, quantity: 1, price: 3000 },
          { productId: prodD._id, quantity: 1, price: 5000 }
        ]
      },
      { upsert: true, new: true }
    );

    const orderData = {
      shippingAddress: {
        fullName: 'Test Commission Customer',
        phone: '9999900001',
        addressLine1: '123 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      paymentMethod: 'COD'
    };

    const order = await orderService.createOrder(customerUser._id, orderData);

    assert(order.grandTotal === 11000, `Customer pays full order total: ₹${order.grandTotal} (expected ₹11,000)`);

    // Fetch vendor orders
    const vendorOrders = await VendorOrder.find({ parentOrderId: order._id });
    assert(vendorOrders.length === 3, 'Created exactly 3 vendor suborders for 3 distinct vendors');

    const v1Order = vendorOrders.find(v => v.vendorId.toString() === vendor1._id.toString());
    const v2Order = vendorOrders.find(v => v.vendorId.toString() === vendor2._id.toString());
    const v3Order = vendorOrders.find(v => v.vendorId.toString() === vendor3._id.toString());

    // Vendor 1: Product A (₹1,000) -> 5% comm = ₹50, vendor proceeds = ₹950
    assert(v1Order.grandTotal === 1000, 'Vendor 1 gross total = ₹1,000');
    assert(v1Order.platformCommission === 50, 'Vendor 1 platform commission = ₹50');
    assert(v1Order.vendorEarning === 950, 'Vendor 1 proceeds = ₹950');

    // Vendor 2: Product B (₹2,000) + Product D (₹5,000) -> ₹7,000 -> 5% comm = ₹350, vendor proceeds = ₹6,650
    assert(v2Order.grandTotal === 7000, 'Vendor 2 gross total = ₹7,000');
    assert(v2Order.platformCommission === 350, 'Vendor 2 platform commission = ₹350 (₹100 + ₹250)');
    assert(v2Order.vendorEarning === 6650, 'Vendor 2 proceeds = ₹6,650 (₹1,900 + ₹4,750)');

    // Vendor 3: Product C (₹3,000) -> 5% comm = ₹150, vendor proceeds = ₹2,850
    assert(v3Order.grandTotal === 3000, 'Vendor 3 gross total = ₹3,000');
    assert(v3Order.platformCommission === 150, 'Vendor 3 platform commission = ₹150');
    assert(v3Order.vendorEarning === 2850, 'Vendor 3 proceeds = ₹2,850');

    // Platform Commission & Total Vendor Proceeds Totals
    const totalPlatformCommission = v1Order.platformCommission + v2Order.platformCommission + v3Order.platformCommission;
    const totalVendorProceeds = v1Order.vendorEarning + v2Order.vendorEarning + v3Order.vendorEarning;

    assert(totalPlatformCommission === 550, `Expected total platform commission = ₹550 (actual: ₹${totalPlatformCommission})`);
    assert(totalVendorProceeds === 10450, `Expected total vendor proceeds = ₹10,450 (actual: ₹${totalVendorProceeds})`);

    // Reconciliation Check: ₹11,000 = ₹550 + ₹10,450
    const totalReconciliation = totalPlatformCommission + totalVendorProceeds;
    assert(totalReconciliation === order.grandTotal, `Reconciliation satisfied: ₹${totalReconciliation} == ₹${order.grandTotal}`);

    // -------------------------------------------------------------
    // TEST SUITE 3: PART D - SEVEN-DAY SETTLEMENT POLICY ENFORCEMENT
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: Seven-Day Holding Policy & Settlement Lock ---');

    // Mark order as DELIVERED & PAID
    order.orderStatus = 'DELIVERED';
    order.paymentStatus = 'PAID';
    await order.save();

    for (const vo of vendorOrders) {
      vo.status = 'DELIVERED';
      await vo.save();
    }

    // Trigger Delivery settlement generator
    await platformCommissionService.onOrderDelivered(order._id);

    // Verify settlements were generated
    const settlements = await VendorSettlement.find({ suborderId: { $in: vendorOrders.map(vo => vo._id) } });
    assert(settlements.length === 3, 'Created 3 vendor settlements upon order delivery');

    for (const s of settlements) {
      assert(s.status === 'ELIGIBLE', `Settlement ${s._id} created with ELIGIBLE status`);
      const eligibleTime = new Date(s.eligibleAt).getTime();
      const expectedMinTime = Date.now() + 6 * 24 * 60 * 60 * 1000; // ~6-7 days ahead
      assert(eligibleTime > expectedMinTime, `Holding period set to 7 days ahead (eligibleAt: ${s.eligibleAt.toISOString()})`);
    }

    // 3.1 Attempt payout before 7 days have elapsed -> MUST BE REJECTED
    const targetSettlement = settlements[0];
    try {
      await platformCommissionService.processVendorPayout(targetSettlement._id, {
        payoutReference: 'TEST-REF-FAIL',
        actorRole: 'SUPER_ADMIN'
      });
      assert(false, 'Expected immediate payout to be blocked by 7-day holding period');
    } catch (err) {
      assert(err.message.includes('7-day holding period') || err.message.includes('locked'), 'Rejected immediate payout with 7-day lock enforcement');
    }

    // 3.2 Simulate that 7 days have elapsed
    targetSettlement.eligibleAt = new Date(Date.now() - 1000); // 1 second in past
    await targetSettlement.save();

    // Now payout must succeed
    const payoutResult = await platformCommissionService.processVendorPayout(targetSettlement._id, {
      payoutReference: 'UTR-BAAPOO-11000-01',
      notes: '7-day holding period completed, payout confirmed',
      actorRole: 'SUPER_ADMIN'
    });

    assert(payoutResult.status === 'PAID', 'Settlement marked as PAID after 7 days elapsed');
    assert(payoutResult.payoutReference === 'UTR-BAAPOO-11000-01', 'Payout reference correctly persisted in financial ledger');

    console.log('\n================================================================');
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('\nTEST RUN FAILED:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
