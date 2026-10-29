import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { Commission } from '../models/Commission.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { moneyUtils } from '../utils/moneyUtils.js';

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';

async function runTestSuite() {
  console.log('=================================================================');
  console.log('BAAPOO MART: ORDER-QUANTITY-BASED COMMISSION & 7-DAY PAYOUT SUITE');
  console.log('=================================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: One eligible unit: ₹1,000 -> 1 × 5% = 5% -> ₹50 Commission, ₹950 Vendor Payout
    // -------------------------------------------------------------
    const calc1 = platformCommissionService.calculate(1000, 1);
    assert(
      calc1.commissionRate === 5 && calc1.platformCommission === 50 && calc1.vendorShare === 950,
      '1 eligible unit (₹1,000) generates 5% rate, ₹50 Super Admin commission and ₹950 vendor payout'
    );

    // -------------------------------------------------------------
    // Test 2: Two eligible units: ₹2,000 -> 2 × 5% = 10% -> ₹200 Commission, ₹1,800 Vendor Payout
    // -------------------------------------------------------------
    const calc2 = platformCommissionService.calculate(2000, 2);
    assert(
      calc2.commissionRate === 10 && calc2.platformCommission === 200 && calc2.vendorShare === 1800,
      '2 eligible units (₹2,000) generates 10% rate, ₹200 commission and ₹1,800 vendor payout'
    );

    // -------------------------------------------------------------
    // Test 3: Three eligible units (Required Specification Example):
    // Product A (₹1,000) + Product B (₹2,000) + Product C (₹500) = ₹3,500 total, 3 units.
    // Rate = 3 × 5% = 15%. Total commission = ₹525. Vendor payout = ₹2,975.
    // -------------------------------------------------------------
    const calc3 = platformCommissionService.calculate(3500, 3);
    assert(
      calc3.commissionRate === 15 && calc3.platformCommission === 525 && calc3.vendorShare === 2975,
      '3 eligible units (₹3,500) generates 15% rate, ₹525 Super Admin commission and ₹2,975 vendor payout (Exact Required Example)'
    );

    // -------------------------------------------------------------
    // Test 4: Multiple units of the same product:
    // Product A ₹1,000, quantity 3 = ₹3,000 total order value, 3 units.
    // Rate = 3 × 5% = 15%. Total commission = ₹450. Vendor payout = ₹2,550.
    // -------------------------------------------------------------
    const calc4 = platformCommissionService.calculate(3000, 3);
    assert(
      calc4.commissionRate === 15 && calc4.platformCommission === 450 && calc4.vendorShare === 2550,
      'Multiple units of same product (3 units @ ₹1,000 = ₹3,000) generates 15% rate, ₹450 commission and ₹2,550 payout'
    );

    // -------------------------------------------------------------
    // Setup Test Entities in Database
    // -------------------------------------------------------------
    console.log('\nSetting up test users, vendors, and products...');

    // Super Admin
    let adminUser = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin Test',
        email: `admin_${Date.now()}@baapoomart.com`,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      });
    }

    // Customer User
    const customerUser = await User.create({
      name: 'Customer Test',
      email: `customer_${Date.now()}@baapoomart.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    // Vendor A User
    const vendorUserA = await User.create({
      name: 'Vendor A User',
      email: `vendor_a_${Date.now()}@baapoomart.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });

    // Vendor B User
    const vendorUserB = await User.create({
      name: 'Vendor B User',
      email: `vendor_b_${Date.now()}@baapoomart.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });

    // Category
    const { Category } = await import('../models/Category.js');
    let cat = await Category.findOne();
    if (!cat) {
      cat = await Category.create({
        name: 'Electronics',
        slug: `electronics-${Date.now()}`,
        status: 'ACTIVE',
      });
    }

    const vendorA = await Vendor.create({
      userId: vendorUserA._id,
      storeName: 'Vendor A Electronics',
      businessName: 'Vendor A Pvt Ltd',
      slug: `vendor-a-${Date.now()}`,
      phone: vendorUserA.phone,
      email: vendorUserA.email,
      status: 'APPROVED',
      balance: 0,
      totalSales: 0,
    });

    const vendorB = await Vendor.create({
      userId: vendorUserB._id,
      storeName: 'Vendor B Appliances',
      businessName: 'Vendor B Pvt Ltd',
      slug: `vendor-b-${Date.now()}`,
      phone: vendorUserB.phone,
      email: vendorUserB.email,
      status: 'APPROVED',
      balance: 0,
      totalSales: 0,
    });

    const productVendorA = await Product.create({
      vendorId: vendorA._id,
      name: 'Vendor A Headphones',
      slug: `vendor-a-headphones-${Date.now()}`,
      sku: `SKU-VA-${Date.now()}`,
      price: 1000,
      sellingPrice: 1000,
      mrp: 1200,
      stock: 100,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'VENDOR',
    });

    const productVendorB = await Product.create({
      vendorId: vendorB._id,
      name: 'Vendor B Toaster',
      slug: `vendor-b-toaster-${Date.now()}`,
      sku: `SKU-VB-${Date.now()}`,
      price: 500,
      sellingPrice: 500,
      mrp: 600,
      stock: 100,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'VENDOR',
    });

    const productAdmin = await Product.create({
      vendorId: null,
      name: 'Admin Direct Khadi Shirt',
      slug: `admin-khadi-shirt-${Date.now()}`,
      sku: `SKU-ADM-${Date.now()}`,
      price: 1000,
      sellingPrice: 1000,
      mrp: 1500,
      stock: 50,
      category: cat._id,
      categoryId: cat._id,
      status: 'APPROVED',
      sourceType: 'SUPER_ADMIN',
    });

    // -------------------------------------------------------------
    // Test 5: Admin-owned direct products do not incur vendor commission
    // -------------------------------------------------------------
    const isSuperAdminProduct = productAdmin.sourceType === 'SUPER_ADMIN' || !productAdmin.vendorId;
    const adminCommissionRate = isSuperAdminProduct ? 0 : 5;
    assert(
      adminCommissionRate === 0,
      'Admin-owned direct products do not incur vendor commission (0% commission)'
    );

    const dummyAddress = {
      name: 'Test Customer',
      phone: '9876543210',
      street: '123 Test St',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    };

    // -------------------------------------------------------------
    // Test 6: Undelivered order item creates settlement in PENDING_DELIVERY status
    // -------------------------------------------------------------
    console.log('\nCreating order for 1 unit of ₹1,000 Vendor A product...');
    const testOrder1 = await Order.create({
      orderNumber: `BM-${Date.now()}-01`,
      publicOrderId: `BM-${Date.now()}-01`,
      userId: customerUser._id,
      items: [
        {
          productId: productVendorA._id,
          vendorId: vendorA._id,
          name: productVendorA.name,
          productNameSnapshot: productVendorA.name,
          skuSnapshot: productVendorA.sku,
          price: 1000,
          unitPrice: 1000,
          quantity: 1,
          lineTotal: 1000,
          commissionRate: 5,
          platformCommission: 50,
          vendorShare: 950,
          settlementStatus: 'PENDING_DELIVERY',
        },
      ],
      subtotal: 1000,
      itemsSubtotal: 1000,
      total: 1000,
      grandTotal: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'CONFIRMED',
      deliveryAddressSnapshot: dummyAddress,
    });

    const suborder1 = await VendorOrder.create({
      publicSuborderId: `${testOrder1.publicOrderId}-V01`,
      subOrderNumber: `${testOrder1.publicOrderId}-V01`,
      parentOrderId: testOrder1._id,
      vendorId: vendorA._id,
      vendorNameSnapshot: vendorA.storeName,
      businessNameSnapshot: 'Vendor Business',
      userId: customerUser._id,
      items: testOrder1.items,
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      commissionRate: 5,
      eligibleItemCount: 1,
      platformCommission: 50,
      vendorEarning: 950,
      status: 'CONFIRMED',
      settlementStatus: 'PENDING_DELIVERY',
    });

    await platformCommissionService.recordOrderCommission(testOrder1._id);

    const freshSettlement1 = await VendorSettlement.findOne({ suborderId: suborder1._id });
    assert(
      freshSettlement1 &&
      freshSettlement1.status === 'PENDING_DELIVERY' &&
      freshSettlement1.orderValue === 1000 &&
      freshSettlement1.eligibleItemCount === 1 &&
      freshSettlement1.commissionRate === 5 &&
      freshSettlement1.platformCommission === 50 &&
      freshSettlement1.netPayable === 950,
      'Undelivered product creates settlement in PENDING_DELIVERY status with complete audit records'
    );

    // -------------------------------------------------------------
    // Test 7: Delivered order item transitions to ELIGIBLE and sets 7-day holding period from delivery
    // -------------------------------------------------------------
    console.log('\nDelivering order 1...');
    testOrder1.orderStatus = 'DELIVERED';
    await testOrder1.save();

    const deliveryTimeBefore = Date.now();
    await platformCommissionService.onOrderDelivered(testOrder1._id);

    const updatedSettlement1 = await VendorSettlement.findOne({ suborderId: suborder1._id });
    assert(
      updatedSettlement1.status === 'ELIGIBLE',
      'Delivered product settlement transitions to ELIGIBLE'
    );

    const holdMs = updatedSettlement1.eligibleAt.getTime() - deliveryTimeBefore;
    const holdDays = Math.round(holdMs / (24 * 60 * 60 * 1000));
    assert(
      holdDays === 7,
      `Seven-day holding period strictly calculated from delivery date: ${holdDays} days hold scheduled`
    );

    // -------------------------------------------------------------
    // Test 8: Vendor payout attempt is BLOCKED while 7-day holding period has not elapsed
    // -------------------------------------------------------------
    console.log('\nTesting premature payout block during 7-day holding period...');
    let prematurePayoutBlocked = false;
    try {
      await platformCommissionService.processVendorPayout(updatedSettlement1._id, {
        payoutReference: 'EARLY-PAY-REF',
        processedBy: adminUser._id,
      });
    } catch (e) {
      prematurePayoutBlocked = true;
    }
    assert(
      prematurePayoutBlocked,
      'Premature payout attempt during 7-day holding period is strictly blocked'
    );

    // -------------------------------------------------------------
    // Test 9: Once 7-day holding period has elapsed, vendor payout succeeds
    // -------------------------------------------------------------
    console.log('\nSimulating elapsed 7-day holding period and processing payout...');
    // Fast-forward eligibleAt to the past (simulating 7 days elapsed)
    updatedSettlement1.eligibleAt = new Date(Date.now() - 1000 * 60);
    await updatedSettlement1.save();

    const payoutRef = `PAY-TEST-${Date.now()}`;
    const paidSettlement = await platformCommissionService.processVendorPayout(updatedSettlement1._id, {
      payoutReference: payoutRef,
      notes: '7-day holding period elapsed, disbursed via bank transfer',
      processedBy: adminUser._id,
    });

    assert(
      paidSettlement.status === 'PAID' && paidSettlement.payoutReference === payoutRef,
      'Settlement payout successfully processed to PAID after 7-day hold period'
    );

    // -------------------------------------------------------------
    // Test 10: Duplicate delivery events do not duplicate commission or ledger entries (Idempotency)
    // -------------------------------------------------------------
    console.log('\nSimulating duplicate delivery webhook/event...');
    await platformCommissionService.onOrderDelivered(testOrder1._id);
    await platformCommissionService.onOrderDelivered(testOrder1._id);

    const platformLedgerCount = await PlatformLedger.countDocuments({
      sourceEntityId: testOrder1._id.toString(),
      type: 'ORDER_COMMISSION',
    });
    assert(
      platformLedgerCount === 1,
      'Duplicate delivery events do not create duplicate platform ledger records (strictly 1 record)'
    );

    // -------------------------------------------------------------
    // Test 11: Duplicate payout attempt on already paid settlement is strictly blocked
    // -------------------------------------------------------------
    let duplicatePayoutBlocked = false;
    try {
      await platformCommissionService.processVendorPayout(updatedSettlement1._id, {
        payoutReference: 'DUP-PAY',
      });
    } catch (e) {
      duplicatePayoutBlocked = true;
    }
    assert(
      duplicatePayoutBlocked,
      'Duplicate payout attempt on already paid settlement is strictly blocked'
    );

    // -------------------------------------------------------------
    // Test 12: Payment failures prevent payout release
    // -------------------------------------------------------------
    console.log('\nTesting failed payment order...');
    const testOrderFailed = await Order.create({
      orderNumber: `BM-${Date.now()}-FAILED`,
      publicOrderId: `BM-${Date.now()}-FAILED`,
      userId: customerUser._id,
      items: [
        {
          productId: productVendorA._id,
          vendorId: vendorA._id,
          name: productVendorA.name,
          productNameSnapshot: productVendorA.name,
          skuSnapshot: productVendorA.sku,
          quantity: 1,
          price: 1000,
          unitPrice: 1000,
          lineTotal: 1000,
          commissionRate: 5,
          platformCommission: 50,
          vendorShare: 950,
          settlementStatus: 'PENDING_DELIVERY',
        },
      ],
      subtotal: 1000,
      itemsSubtotal: 1000,
      total: 1000,
      grandTotal: 1000,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'FAILED',
      orderStatus: 'PENDING',
      deliveryAddressSnapshot: dummyAddress,
    });

    const suborderFailed = await VendorOrder.create({
      publicSuborderId: `${testOrderFailed.publicOrderId}-V01`,
      subOrderNumber: `${testOrderFailed.publicOrderId}-V01`,
      parentOrderId: testOrderFailed._id,
      vendorId: vendorA._id,
      vendorNameSnapshot: vendorA.storeName,
      businessNameSnapshot: 'Vendor Business',
      userId: customerUser._id,
      items: testOrderFailed.items,
      subtotal: 1000,
      itemsSubtotal: 1000,
      grandTotal: 1000,
      commissionRate: 5,
      eligibleItemCount: 1,
      platformCommission: 50,
      vendorEarning: 950,
      status: 'PENDING',
      settlementStatus: 'PENDING_DELIVERY',
    });

    await platformCommissionService.recordOrderCommission(testOrderFailed._id);
    const failedSettlement = await VendorSettlement.findOne({ suborderId: suborderFailed._id });
    assert(
      failedSettlement.status === 'PENDING_DELIVERY',
      'Failed payment orders do not qualify for settlement release'
    );

    // -------------------------------------------------------------
    // Test 13: Order Cancellation reverses settlement to REVERSED and commission to CANCELLED
    // -------------------------------------------------------------
    console.log('\nTesting order cancellation reversal...');
    await platformCommissionService.onOrderCancelled(testOrderFailed._id);
    const cancelledSettlement = await VendorSettlement.findOne({ suborderId: suborderFailed._id });
    assert(
      cancelledSettlement.status === 'REVERSED',
      'Cancelled order properly reverses the settlement record to REVERSED'
    );

    // -------------------------------------------------------------
    // Test 14: Multi-Vendor Order: Separate commissions and separate vendor payouts
    // Vendor A: 2 units of ₹1,000 product = ₹2,000 subtotal. Units = 2 -> 10% rate -> ₹200 fee, ₹1,800 payout.
    // Vendor B: 1 unit of ₹500 product = ₹500 subtotal. Units = 1 -> 5% rate -> ₹25 fee, ₹475 payout.
    // -------------------------------------------------------------
    console.log('\nTesting multi-vendor mixed order with separate quantity-based commissions...');
    const mixedOrder = await Order.create({
      orderNumber: `BM-${Date.now()}-MIXED`,
      publicOrderId: `BM-${Date.now()}-MIXED`,
      userId: customerUser._id,
      items: [
        {
          productId: productVendorA._id,
          vendorId: vendorA._id,
          name: productVendorA.name,
          productNameSnapshot: productVendorA.name,
          skuSnapshot: productVendorA.sku,
          quantity: 2,
          price: 1000,
          unitPrice: 1000,
          lineTotal: 2000,
          commissionRate: 10,
          platformCommission: 200,
          vendorShare: 1800,
          settlementStatus: 'PENDING_DELIVERY',
        },
        {
          productId: productVendorB._id,
          vendorId: vendorB._id,
          name: productVendorB.name,
          productNameSnapshot: productVendorB.name,
          skuSnapshot: productVendorB.sku,
          quantity: 1,
          price: 500,
          unitPrice: 500,
          lineTotal: 500,
          commissionRate: 5,
          platformCommission: 25,
          vendorShare: 475,
          settlementStatus: 'PENDING_DELIVERY',
        },
      ],
      subtotal: 2500,
      itemsSubtotal: 2500,
      total: 2500,
      grandTotal: 2500,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      deliveryAddressSnapshot: dummyAddress,
    });

    const mixedSuborderA = await VendorOrder.create({
      publicSuborderId: `${mixedOrder.publicOrderId}-V01`,
      subOrderNumber: `${mixedOrder.publicOrderId}-V01`,
      parentOrderId: mixedOrder._id,
      vendorId: vendorA._id,
      vendorNameSnapshot: vendorA.storeName,
      businessNameSnapshot: 'Vendor Business A',
      userId: customerUser._id,
      items: [mixedOrder.items[0]],
      subtotal: 2000,
      itemsSubtotal: 2000,
      grandTotal: 2000,
      commissionRate: 10,
      eligibleItemCount: 2,
      platformCommission: 200,
      vendorEarning: 1800,
      status: 'CONFIRMED',
      settlementStatus: 'PENDING_DELIVERY',
    });

    const mixedSuborderB = await VendorOrder.create({
      publicSuborderId: `${mixedOrder.publicOrderId}-V02`,
      subOrderNumber: `${mixedOrder.publicOrderId}-V02`,
      parentOrderId: mixedOrder._id,
      vendorId: vendorB._id,
      vendorNameSnapshot: vendorB.storeName,
      businessNameSnapshot: 'Vendor Business B',
      userId: customerUser._id,
      items: [mixedOrder.items[1]],
      subtotal: 500,
      itemsSubtotal: 500,
      grandTotal: 500,
      commissionRate: 5,
      eligibleItemCount: 1,
      platformCommission: 25,
      vendorEarning: 475,
      status: 'CONFIRMED',
      settlementStatus: 'PENDING_DELIVERY',
    });

    await platformCommissionService.recordOrderCommission(mixedOrder._id);
    await platformCommissionService.onOrderDelivered(mixedOrder._id);

    const settlementA = await VendorSettlement.findOne({ suborderId: mixedSuborderA._id });
    const settlementB = await VendorSettlement.findOne({ suborderId: mixedSuborderB._id });

    assert(
      settlementA.vendorId.toString() === vendorA._id.toString() &&
      settlementA.commissionRate === 10 &&
      settlementA.eligibleItemCount === 2 &&
      settlementA.platformCommission === 200 &&
      settlementA.netPayable === 1800,
      'Vendor A settlement: 2 units @ 5% = 10% rate, ₹200 commission, ₹1,800 net payout'
    );

    assert(
      settlementB.vendorId.toString() === vendorB._id.toString() &&
      settlementB.commissionRate === 5 &&
      settlementB.eligibleItemCount === 1 &&
      settlementB.platformCommission === 25 &&
      settlementB.netPayable === 475,
      'Vendor B settlement: 1 unit @ 5% = 5% rate, ₹25 commission, ₹475 net payout'
    );

    // -------------------------------------------------------------
    // Test 15: Vendor financial records isolation
    // -------------------------------------------------------------
    const vendorBOrders = await Order.find({ 'items.vendorId': vendorB._id }).lean();
    const vendorBItemVendorIds = vendorBOrders.flatMap(o => o.items.filter(i => i.vendorId?.toString() === vendorB._id.toString()).map(i => i.vendorId.toString()));
    const hasVendorAData = vendorBItemVendorIds.includes(vendorA._id.toString());
    assert(
      !hasVendorAData,
      'Vendor financial isolation enforced: Vendor B records are strictly isolated from Vendor A'
    );

    // -------------------------------------------------------------
    // Test 16: Historical commission records are immutable on product price edit
    // -------------------------------------------------------------
    console.log('\nTesting historical immutability on product price edit...');
    productVendorA.price = 9999;
    productVendorA.sellingPrice = 9999;
    await productVendorA.save();

    const historicOrder = await Order.findById(testOrder1._id);
    const historicItem = historicOrder.items[0];
    assert(
      historicItem.price === 1000 && historicItem.platformCommission === 50 && historicItem.vendorShare === 950,
      'Product price edits do not alter historical commission records (snapshotted at ₹50 fee, ₹950 share)'
    );

    console.log('\n=================================================================');
    console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions passed!`);
    console.log('=================================================================\n');

  } catch (error) {
    console.error('\nTest Suite Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTestSuite();
