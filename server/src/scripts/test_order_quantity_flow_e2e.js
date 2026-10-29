import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { orderService } from '../services/orderService.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { paymentService } from '../services/paymentService.js';
import { settlementService } from '../services/settlementService.js';

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';

async function runE2ETest() {
  console.log('=================================================================');
  console.log('BAAPOO MART: END-TO-END ORDER QUANTITY COMMISSION & PAYOUT TEST');
  console.log('=================================================================\n');

  await mongoose.connect(MONGODB_URI);

  let passed = 0;
  let total = 0;
  function assert(cond, msg) {
    total++;
    if (cond) {
      console.log(`  [PASS] Test ${total}: ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${msg}`);
      throw new Error(`Failed: ${msg}`);
    }
  }

  try {
    // 1. Create or fetch test users
    let admin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        email: `admin_${Date.now()}@baapoomart.com`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      });
    }

    const customer = await User.create({
      name: 'Customer E2E',
      email: `customer_e2e_${Date.now()}@baapoomart.com`,
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    const vendorUser1 = await User.create({
      name: 'Vendor One User',
      email: `v1_${Date.now()}@baapoomart.com`,
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });

    const vendorUser2 = await User.create({
      name: 'Vendor Two User',
      email: `v2_${Date.now()}@baapoomart.com`,
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });

    let cat = await Category.findOne();
    if (!cat) {
      cat = await Category.create({ name: 'General', slug: `cat-${Date.now()}`, status: 'ACTIVE' });
    }

    const v1 = await Vendor.create({
      userId: vendorUser1._id,
      storeName: 'Vendor 1 Hub',
      businessName: 'Vendor 1 LLC',
      slug: `v1-${Date.now()}`,
      phone: vendorUser1.phone,
      email: vendorUser1.email,
      status: 'APPROVED',
      balance: 0,
      totalSales: 0,
    });

    const v2 = await Vendor.create({
      userId: vendorUser2._id,
      storeName: 'Vendor 2 Hub',
      businessName: 'Vendor 2 LLC',
      slug: `v2-${Date.now()}`,
      phone: vendorUser2.phone,
      email: vendorUser2.email,
      status: 'APPROVED',
      balance: 0,
      totalSales: 0,
    });

    // Create Products
    const prodA = await Product.create({
      vendorId: v1._id,
      name: 'Product A',
      slug: `prod-a-${Date.now()}`,
      sku: `SKU-A-${Date.now()}`,
      price: 1000,
      sellingPrice: 1000,
      mrp: 1200,
      stock: 50,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'VENDOR',
    });

    const prodB = await Product.create({
      vendorId: v1._id,
      name: 'Product B',
      slug: `prod-b-${Date.now()}`,
      sku: `SKU-B-${Date.now()}`,
      price: 2000,
      sellingPrice: 2000,
      mrp: 2500,
      stock: 50,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'VENDOR',
    });

    const prodC = await Product.create({
      vendorId: v1._id,
      name: 'Product C',
      slug: `prod-c-${Date.now()}`,
      sku: `SKU-C-${Date.now()}`,
      price: 500,
      sellingPrice: 500,
      mrp: 600,
      stock: 50,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'VENDOR',
    });

    const prodD = await Product.create({
      vendorId: v2._id,
      name: 'Product D',
      slug: `prod-d-${Date.now()}`,
      sku: `SKU-D-${Date.now()}`,
      price: 1500,
      sellingPrice: 1500,
      mrp: 1800,
      stock: 50,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'VENDOR',
    });

    const address = {
      name: 'Customer E2E',
      phone: '9999988888',
      street: '456 Market Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
    };

    // -------------------------------------------------------------------------
    // Scenario 1: Exactly the Required Example through orderService.createOrder
    // Customer purchases:
    // - Product A: ₹1,000 (qty 1)
    // - Product B: ₹2,000 (qty 1)
    // - Product C: ₹500 (qty 1)
    // Total order value = ₹3,500.
    // Eligible units = 3.
    // Commission rate = 3 × 5% = 15%.
    // Super Admin commission = ₹3,500 × 15% = ₹525.
    // Vendor payout = ₹3,500 − ₹525 = ₹2,975.
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 1: Required Example via Cart Checkout ---');
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [
          { productId: prodA._id, quantity: 1, price: 1000 },
          { productId: prodB._id, quantity: 1, price: 2000 },
          { productId: prodC._id, quantity: 1, price: 500 },
        ],
      },
      { upsert: true, new: true }
    );

    const order1 = await orderService.createOrder(customer._id, {
      shippingAddress: address,
      paymentMethod: 'COD',
    });

    assert(order1.grandTotal === 3500, 'Order 1 grand total is ₹3,500');

    const suborders1 = await VendorOrder.find({ parentOrderId: order1._id });
    assert(suborders1.length === 1, 'Single vendor order created for Vendor 1');
    const so1 = suborders1[0];

    assert(so1.eligibleItemCount === 3, 'Eligible item count is 3 units');
    assert(so1.commissionRate === 15, 'Calculated commission rate is 15% (3 × 5%)');
    assert(so1.platformCommission === 525, 'Super Admin commission is ₹525 (₹3,500 × 15%)');
    assert(so1.vendorEarning === 2975, 'Vendor payout is ₹2,975 (₹3,500 − ₹525)');

    const settlement1 = await VendorSettlement.findOne({ suborderId: so1._id });
    assert(
      settlement1 &&
      settlement1.orderValue === 3500 &&
      settlement1.eligibleItemCount === 3 &&
      settlement1.commissionRate === 15 &&
      settlement1.platformCommission === 525 &&
      settlement1.netPayable === 2975,
      'VendorSettlement record accurately captures ₹3,500 order value, 3 units, 15% commission rate, ₹525 fee, and ₹2,975 payout'
    );

    // -------------------------------------------------------------------------
    // Scenario 2: Multiple Units of the Same Product (e.g. 2 units of Product A)
    // - Product A: ₹1,000, qty 2.
    // Order value = ₹2,000.
    // Units = 2.
    // Commission rate = 2 × 5% = 10%.
    // Commission = ₹200.
    // Payout = ₹1,800.
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Multiple Units of Same Product ---');
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [{ productId: prodA._id, quantity: 2, price: 1000 }],
      },
      { upsert: true, new: true }
    );

    const order2 = await orderService.createOrder(customer._id, {
      shippingAddress: address,
      paymentMethod: 'COD',
    });
    const so2 = await VendorOrder.findOne({ parentOrderId: order2._id });

    assert(so2.eligibleItemCount === 2, 'Vendor order has 2 units of same product');
    assert(so2.commissionRate === 10, 'Commission rate is 10% (2 × 5%)');
    assert(so2.platformCommission === 200, 'Commission is ₹200 (₹2,000 × 10%)');
    assert(so2.vendorEarning === 1800, 'Vendor payout is ₹1,800 (₹2,000 − ₹200)');

    // -------------------------------------------------------------------------
    // Scenario 3: Multiple Vendors in Single Order
    // Vendor 1: Product A (qty 1, ₹1,000) -> 1 unit -> 5% -> ₹50 comm, ₹950 payout.
    // Vendor 2: Product D (qty 2, ₹1,500 each = ₹3,000) -> 2 units -> 10% -> ₹300 comm, ₹2,700 payout.
    // Total order value = ₹4,000.
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Multiple Vendors in Single Order ---');
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [
          { productId: prodA._id, quantity: 1, price: 1000 },
          { productId: prodD._id, quantity: 2, price: 1500 },
        ],
      },
      { upsert: true, new: true }
    );

    const order3 = await orderService.createOrder(customer._id, {
      shippingAddress: address,
      paymentMethod: 'COD',
    });
    const soList3 = await VendorOrder.find({ parentOrderId: order3._id });
    assert(soList3.length === 2, '2 separate vendor suborders created');

    const v1Suborder = soList3.find(s => s.vendorId.toString() === v1._id.toString());
    const v2Suborder = soList3.find(s => s.vendorId.toString() === v2._id.toString());

    assert(v1Suborder.eligibleItemCount === 1, 'Vendor 1 eligible units = 1');
    assert(v1Suborder.commissionRate === 5, 'Vendor 1 commission rate = 5%');
    assert(v1Suborder.platformCommission === 50, 'Vendor 1 commission = ₹50');
    assert(v1Suborder.vendorEarning === 950, 'Vendor 1 payout = ₹950');

    assert(v2Suborder.eligibleItemCount === 2, 'Vendor 2 eligible units = 2');
    assert(v2Suborder.commissionRate === 10, 'Vendor 2 commission rate = 10%');
    assert(v2Suborder.platformCommission === 300, 'Vendor 2 commission = ₹300');
    assert(v2Suborder.vendorEarning === 2700, 'Vendor 2 payout = ₹2,700');

    // -------------------------------------------------------------------------
    // Scenario 4: Delivery and 7-Day Vendor Holding Period
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Delivery and 7-Day Holding Period Verification ---');
    order1.orderStatus = 'DELIVERED';
    await order1.save();

    const deliveredAt = new Date();
    await platformCommissionService.onOrderDelivered(order1._id);

    const activeSettlement1 = await VendorSettlement.findOne({ suborderId: so1._id });
    assert(activeSettlement1.status === 'ELIGIBLE', 'Settlement status transitioned to ELIGIBLE upon delivery');

    const scheduledHoldDays = Math.round((activeSettlement1.eligibleAt.getTime() - deliveredAt.getTime()) / (24 * 60 * 60 * 1000));
    assert(scheduledHoldDays === 7, `7-day holding period verified starting from delivery date (${scheduledHoldDays} days)`);

    // Verify premature payout is blocked
    let blockedBefore7Days = false;
    try {
      await platformCommissionService.processVendorPayout(activeSettlement1._id, {
        payoutReference: 'PREMATURE-PAY',
        processedBy: admin._id,
      });
    } catch (e) {
      blockedBefore7Days = true;
    }
    assert(blockedBefore7Days, 'Payout release is blocked during the 7-day holding period');

    // Fast-forward eligibleAt to now (7 days elapsed)
    activeSettlement1.eligibleAt = new Date(Date.now() - 1000 * 60);
    await activeSettlement1.save();

    const payoutTx = await platformCommissionService.processVendorPayout(activeSettlement1._id, {
      payoutReference: 'CONFIRMED-PAY-01',
      notes: '7-day holding period complete',
      processedBy: admin._id,
    });
    assert(payoutTx.status === 'PAID', 'Payout release succeeds once 7-day period has elapsed');

    // -------------------------------------------------------------------------
    // Scenario 5: Settlement Batch Service respects 7-day hold
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Batch Settlement Service Respects 7-Day Hold ---');
    // Order 2 delivered today -> hold period is in the future
    order2.orderStatus = 'DELIVERED';
    await order2.save();
    await platformCommissionService.onOrderDelivered(order2._id);

    // Run batch processor: order2 settlement must NOT be processed because hold period has not elapsed
    const batchRes = await settlementService.processEligibleSettlements(admin._id, '127.0.0.1');
    const order2Settlement = await VendorSettlement.findOne({ suborderId: so2._id });
    assert(order2Settlement.status === 'ELIGIBLE', 'Order 2 settlement remains in ELIGIBLE/holding (not premature batch processed)');

    console.log('\n=================================================================');
    console.log(`ALL E2E SCENARIOS PASSED: ${passed} / ${total} assertions passed!`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('\nE2E Test Suite Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runE2ETest();
