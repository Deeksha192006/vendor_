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
import { Category } from '../models/Category.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorReferralCommission } from '../models/VendorReferralCommission.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { platformCommissionService } from '../services/platformCommissionService.js';
import { orderService } from '../services/orderService.js';
import { moneyUtils } from '../utils/moneyUtils.js';

async function runTests() {
  console.log('========================================================================');
  console.log('BAAPOO MART: 3% DIRECT VENDOR REFERRAL COMMISSION - 10 TEST SCENARIOS');
  console.log('========================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fairkart';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

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
    const timestamp = Date.now();

    console.log('Setting up Category and Vendor accounts (A, B, C, D)...');

    let category = await Category.findOne({ slug: 'cosmetics-beauty' });
    if (!category) {
      category = await Category.create({
        name: 'Cosmetics & Beauty',
        slug: 'cosmetics-beauty',
        isActive: true,
      });
    }

    // 1. Vendor A (Referrer of B)
    const userA = await User.create({
      name: `Vendor User A ${timestamp}`,
      email: `vendorA_${timestamp}@baapoomart.com`,
      phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });
    const vendorA = await Vendor.create({
      userId: userA._id,
      storeName: `Vendor Store A ${timestamp}`,
      slug: `vendor-a-${timestamp}`,
      status: 'APPROVED',
      isApproved: true,
      balance: 0,
    });

    // 2. Vendor B (Referred directly by Vendor A)
    const userB = await User.create({
      name: `Vendor User B ${timestamp}`,
      email: `vendorB_${timestamp}@baapoomart.com`,
      phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
      referredBy: userA._id,
    });
    const vendorB = await Vendor.create({
      userId: userB._id,
      storeName: `Vendor Store B ${timestamp}`,
      slug: `vendor-b-${timestamp}`,
      status: 'APPROVED',
      isApproved: true,
      referredByVendorId: vendorA._id,
      referredByUserId: userA._id,
      balance: 0,
    });

    // 3. Vendor C (Referred directly by Vendor B)
    const userC = await User.create({
      name: `Vendor User C ${timestamp}`,
      email: `vendorC_${timestamp}@baapoomart.com`,
      phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
      referredBy: userB._id,
    });
    const vendorC = await Vendor.create({
      userId: userC._id,
      storeName: `Vendor Store C ${timestamp}`,
      slug: `vendor-c-${timestamp}`,
      status: 'APPROVED',
      isApproved: true,
      referredByVendorId: vendorB._id,
      referredByUserId: userB._id,
      balance: 0,
    });

    // 4. Vendor D (Unreferred Vendor)
    const userD = await User.create({
      name: `Vendor User D ${timestamp}`,
      email: `vendorD_${timestamp}@baapoomart.com`,
      phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'VENDOR',
      status: 'ACTIVE',
    });
    const vendorD = await Vendor.create({
      userId: userD._id,
      storeName: `Vendor Store D ${timestamp}`,
      slug: `vendor-d-${timestamp}`,
      status: 'APPROVED',
      isApproved: true,
      balance: 0,
    });

    // Customer
    const customer = await User.create({
      name: `Customer ${timestamp}`,
      email: `customer_${timestamp}@baapoomart.com`,
      phone: `95${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    // Create Products
    // Product 1: Vendor B Matte Lipstick (₹500)
    const prodLipstickB = await Product.create({
      name: 'BAAPOO Matte Red Lipstick',
      slug: `baapoo-lipstick-${timestamp}`,
      sku: `SKU-LIP-${timestamp}`,
      categoryId: category._id,
      vendorId: vendorB._id,
      price: 500,
      mrp: 600,
      stock: 100,
      isActive: true,
      status: 'APPROVED',
      images: ['https://example.com/lip1.jpg'],
    });

    // Product 2: Vendor C Perfume (₹1,000)
    const prodPerfumeC = await Product.create({
      name: 'BAAPOO Luxury Perfume',
      slug: `baapoo-perfume-${timestamp}`,
      sku: `SKU-PERF-${timestamp}`,
      categoryId: category._id,
      vendorId: vendorC._id,
      price: 1000,
      mrp: 1200,
      stock: 100,
      isActive: true,
      status: 'APPROVED',
      images: ['https://example.com/perf1.jpg'],
    });

    // Product 3: Vendor D Face Serum (₹500 - Unreferred Vendor)
    const prodSerumD = await Product.create({
      name: 'BAAPOO Vitamin C Serum',
      slug: `baapoo-serum-${timestamp}`,
      sku: `SKU-SERUM-${timestamp}`,
      categoryId: category._id,
      vendorId: vendorD._id,
      price: 500,
      mrp: 650,
      stock: 100,
      isActive: true,
      status: 'APPROVED',
      images: ['https://example.com/serum1.jpg'],
    });

    const standardShipping = {
      fullName: 'Deeksha Customer',
      phone: '9876543210',
      addressLine1: 'MG Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
    };

    console.log('Setup completed.\n');

    // -------------------------------------------------------------
    // SCENARIO 1: Direct Vendor Referral Relationship Setup
    // -------------------------------------------------------------
    console.log('--- SCENARIO 1: Direct Vendor Referral Relationship Setup ---');
    const directReferrerOfB = await platformCommissionService.getDirectReferrerVendor(vendorB._id);
    assert(directReferrerOfB !== null, 'Vendor B has a direct referrer');
    assert(directReferrerOfB._id.toString() === vendorA._id.toString(), 'Vendor A is recorded as Vendor B direct referrer');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 2: ₹500 Lipstick Sale by Vendor B - Precision Commission Split
    // -------------------------------------------------------------
    console.log('--- SCENARIO 2: ₹500 Lipstick Sale by Vendor B ---');
    // Pure calculation verification
    const split500 = platformCommissionService.calculateLine(500, 1, true);
    assert(split500.platformCommissionRate === 5, 'Super Admin Platform Commission rate is 5%');
    assert(split500.platformCommission === 25, 'Super Admin Platform Commission is ₹25 (5% of ₹500)');
    assert(split500.referralCommissionRate === 3, 'Vendor Direct Referral Commission rate is 3%');
    assert(split500.referralCommission === 15, 'Vendor A Direct Referral Commission is ₹15 (3% of ₹500)');
    assert(split500.vendorShareRate === 92, 'Vendor B Proceeds rate is 92%');
    assert(split500.vendorProceeds === 460, 'Vendor B Net Proceeds is ₹460 (92% of ₹500)');
    assert(
      moneyUtils.addMoney(moneyUtils.addMoney(split500.platformCommission, split500.referralCommission), split500.vendorProceeds) === 500,
      'Split total equals exactly ₹500 (₹25 + ₹15 + ₹460 = ₹500)'
    );

    // Place Order via OrderService with Cart
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [{ productId: prodLipstickB._id, quantity: 1, price: 500 }],
      },
      { upsert: true, new: true }
    );

    const order1 = await orderService.createOrder(customer._id, {
      shippingAddress: standardShipping,
      paymentMethod: 'COD',
    });

    assert(order1.grandTotal === 500, 'Customer pays full order total: ₹500');

    const suborders1 = await VendorOrder.find({ parentOrderId: order1._id });
    assert(suborders1.length === 1, 'Created exactly 1 vendor suborder for Vendor B');

    const suborderB = suborders1[0];
    assert(suborderB.grandTotal === 500, 'Suborder gross total is ₹500');
    assert(suborderB.platformCommission === 25, 'Super Admin Platform Commission recorded on suborder is ₹25 (5%)');
    assert(suborderB.referralCommission === 15, 'Vendor A Referral Commission recorded on suborder is ₹15 (3%)');
    assert(suborderB.vendorEarning === 460, 'Vendor B Net Proceeds recorded on suborder is ₹460 (92%)');
    assert(suborderB.referrerVendorId?.toString() === vendorA._id.toString(), 'Suborder links directly to Referrer Vendor A');

    // Commission snapshot in VendorReferralCommission
    const refRecord1 = await VendorReferralCommission.findOne({
      orderId: order1._id,
      suborderId: suborderB._id,
    });
    assert(refRecord1 !== null, 'VendorReferralCommission record created in database');
    assert(refRecord1.referrerVendorId.toString() === vendorA._id.toString(), 'Referrer vendor is Vendor A');
    assert(refRecord1.sellingVendorId.toString() === vendorB._id.toString(), 'Selling vendor is Vendor B');
    assert(refRecord1.eligibleSaleAmount === 500, 'Eligible sale amount is ₹500');
    assert(refRecord1.commissionRate === 3, 'Commission rate is 3%');
    assert(refRecord1.commissionAmount === 15, 'Referral commission amount is ₹15');
    assert(refRecord1.settlementStatus === 'PENDING_DELIVERY', 'Initial settlementStatus is PENDING_DELIVERY');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 3: Multi-Vendor Relationships / Strict 1-to-1 Attribution
    // -------------------------------------------------------------
    console.log('--- SCENARIO 3: Multi-Vendor Relationships & No Multi-Level Distribution ---');
    // Vendor A -> Vendor B -> Vendor C
    const directReferrerOfC = await platformCommissionService.getDirectReferrerVendor(vendorC._id);
    assert(directReferrerOfC._id.toString() === vendorB._id.toString(), 'Vendor C direct referrer is Vendor B');

    // Place Order for Vendor C Perfume (₹1,000)
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [{ productId: prodPerfumeC._id, quantity: 1, price: 1000 }],
      },
      { upsert: true, new: true }
    );

    const orderC = await orderService.createOrder(customer._id, {
      shippingAddress: standardShipping,
      paymentMethod: 'COD',
    });

    const suborderC = await VendorOrder.findOne({ parentOrderId: orderC._id });
    assert(suborderC.platformCommission === 50, 'Platform Commission on ₹1,000 sale is ₹50 (5%)');
    assert(suborderC.referralCommission === 30, 'Direct Referral Commission on ₹1,000 sale is ₹30 (3%)');
    assert(suborderC.vendorEarning === 920, 'Vendor C proceeds on ₹1,000 sale is ₹920 (92%)');

    const refRecordC = await VendorReferralCommission.findOne({ orderId: orderC._id });
    assert(refRecordC.referrerVendorId.toString() === vendorB._id.toString(), 'Vendor B is the sole beneficiary of Vendor C sale');
    assert(refRecordC.commissionAmount === 30, 'Vendor B receives ₹30 referral commission');

    // Verify Vendor A receives ₹0 from Vendor C's sale
    const anyRecordForAfromC = await VendorReferralCommission.findOne({
      orderId: orderC._id,
      referrerVendorId: vendorA._id,
    });
    assert(anyRecordForAfromC === null, 'Vendor A receives ₹0 from Vendor C sale (No multi-level spreading)');

    // Verify Vendor B receives ₹0 referral commission on its OWN sales
    const refRecordOwnSale = await VendorReferralCommission.findOne({
      orderId: order1._id,
      referrerVendorId: vendorB._id,
    });
    assert(refRecordOwnSale === null, 'Vendor B receives ₹0 referral commission on own sales');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 4: Vendor without Referrer (Vendor D)
    // -------------------------------------------------------------
    console.log('--- SCENARIO 4: Vendor without Referrer ---');
    const directReferrerOfD = await platformCommissionService.getDirectReferrerVendor(vendorD._id);
    assert(directReferrerOfD === null, 'Vendor D has NO direct referrer');

    // Place Order for Vendor D Face Serum (₹500)
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [{ productId: prodSerumD._id, quantity: 1, price: 500 }],
      },
      { upsert: true, new: true }
    );

    const orderD = await orderService.createOrder(customer._id, {
      shippingAddress: standardShipping,
      paymentMethod: 'COD',
    });

    const suborderD = await VendorOrder.findOne({ parentOrderId: orderD._id });
    assert(suborderD.platformCommission === 25, 'Super Admin Platform Commission is 5% = ₹25');
    assert(suborderD.referralCommission === 0, 'Direct Referral Commission is ₹0 (0%)');
    assert(suborderD.vendorEarning === 475, 'Vendor D proceeds is full 95% = ₹475');

    const anyRefRecordD = await VendorReferralCommission.findOne({ orderId: orderD._id });
    assert(anyRefRecordD === null, 'No VendorReferralCommission record created when vendor has no referrer');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 5: Validation Rules (Self-Referral & Loop Prevention)
    // -------------------------------------------------------------
    console.log('--- SCENARIO 5: Validation Rules (Self-Referral & Loop Prevention) ---');
    // If a vendor tries to refer itself
    vendorA.referredByVendorId = vendorA._id;
    await vendorA.save();
    const selfCheckA = await platformCommissionService.getDirectReferrerVendor(vendorA._id);
    assert(selfCheckA === null, 'Self-referral is rejected (returns null)');
    vendorA.referredByVendorId = null;
    await vendorA.save();

    // Circular loop prevention: Vendor A -> Vendor B, so Vendor B cannot refer Vendor A
    vendorA.referredByVendorId = vendorB._id;
    await vendorA.save();
    const loopCheck = await platformCommissionService.getDirectReferrerVendor(vendorA._id);
    assert(loopCheck === null, 'Circular loop (A->B and B->A) is detected and rejected');
    vendorA.referredByVendorId = null;
    await vendorA.save();
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 6: Failed Customer Payment Handling
    // -------------------------------------------------------------
    console.log('--- SCENARIO 6: Failed Customer Payment Handling ---');
    // Create an order that was marked payment failed
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [{ productId: prodLipstickB._id, quantity: 1, price: 500 }],
      },
      { upsert: true, new: true }
    );
    const orderFail = await orderService.createOrder(customer._id, {
      shippingAddress: standardShipping,
      paymentMethod: 'COD',
    });
    orderFail.paymentStatus = 'FAILED';
    orderFail.orderStatus = 'CANCELLED';
    await orderFail.save();

    const suborderFail = await VendorOrder.findOne({ parentOrderId: orderFail._id });
    suborderFail.status = 'CANCELLED';
    await suborderFail.save();

    // Update commission on failed order
    await platformCommissionService.onOrderCancelled(orderFail._id, {
      suborderId: suborderFail._id,
      reason: 'Payment failed at gateway',
    });

    const failRefComm = await VendorReferralCommission.findOne({ orderId: orderFail._id });
    assert(
      failRefComm.commissionStatus === 'CANCELLED' && failRefComm.settlementStatus === 'CANCELLED',
      'Failed payment marks commission as CANCELLED with no payouts'
    );
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 7: Delivery Verification & 7-Day Holding Lock
    // -------------------------------------------------------------
    console.log('--- SCENARIO 7: Delivery Verification & 7-Day Holding Lock ---');
    const deliveryTimestamp = new Date();
    order1.orderStatus = 'DELIVERED';
    order1.paymentStatus = 'PAID';
    await order1.save();

    suborderB.status = 'DELIVERED';
    await suborderB.save();

    await platformCommissionService.onOrderDelivered(order1._id, {
      suborderId: suborderB._id,
      deliveredAt: deliveryTimestamp,
    });

    const deliveredRefComm = await VendorReferralCommission.findOne({ orderId: order1._id });
    assert(deliveredRefComm.commissionStatus === 'EARNED', 'Commission status is EARNED upon delivery');
    assert(deliveredRefComm.settlementStatus === 'ELIGIBLE', 'Settlement status is ELIGIBLE upon delivery');
    assert(deliveredRefComm.deliveredAt !== null, 'Delivered date is recorded');
    assert(deliveredRefComm.eligibleAt !== null, '7-Day holding release date (eligibleAt) is calculated');

    const expectedUnlockDate = new Date(deliveryTimestamp.getTime() + 7 * 24 * 60 * 60 * 1000);
    const timeDiffMs = Math.abs(deliveredRefComm.eligibleAt.getTime() - expectedUnlockDate.getTime());
    assert(timeDiffMs < 5000, 'eligibleAt is precisely 7 days (7 * 24 hours) after delivery');

    // Attempt payout early (before 7 days) - MUST FAIL
    let earlyPayoutThrew = false;
    try {
      await platformCommissionService.processVendorReferralPayout(deliveredRefComm._id, {
        payoutReference: 'EARLY-FAIL',
      });
    } catch (err) {
      earlyPayoutThrew = true;
      assert(err.message.includes('7-day holding period'), `Early payout correctly rejected: "${err.message}"`);
    }
    assert(earlyPayoutThrew === true, 'Early payout before 7 days was rejected');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 8: Payout Release After 7 Days
    // -------------------------------------------------------------
    console.log('--- SCENARIO 8: Payout Release After 7-Day Hold Has Elapsed ---');
    // Simulate passage of 7 days by setting eligibleAt to the past
    deliveredRefComm.eligibleAt = new Date(Date.now() - 1000 * 60); // 1 minute ago
    await deliveredRefComm.save();

    const utrRef = `UTR-${Date.now()}-TEST`;
    const paidRefComm = await platformCommissionService.processVendorReferralPayout(deliveredRefComm._id, {
      payoutReference: utrRef,
      notes: 'Test payout release after 7 days',
    });

    assert(paidRefComm.settlementStatus === 'PAID', 'Referral commission settlementStatus transitioned to PAID');
    assert(paidRefComm.payoutReference === utrRef, `Payout reference recorded as ${utrRef}`);
    assert(paidRefComm.paidAt !== null, 'paidAt timestamp recorded');

    // Verify VendorLedger transaction
    const ledgerRecord = await VendorLedger.findOne({
      vendorId: vendorA._id,
      transactionType: 'VENDOR_REFERRAL_PAYOUT',
    });
    assert(ledgerRecord !== null, 'VendorLedger record created for VENDOR_REFERRAL_PAYOUT');
    assert(ledgerRecord.debit === 15, 'Ledger debit is ₹15');

    // Re-attempting payout on already PAID record must fail
    let duplicatePayoutThrew = false;
    try {
      await platformCommissionService.processVendorReferralPayout(deliveredRefComm._id);
    } catch (err) {
      duplicatePayoutThrew = true;
      assert(err.message.includes('already been paid out'), `Duplicate payout rejected: "${err.message}"`);
    }
    assert(duplicatePayoutThrew === true, 'Duplicate payout attempt rejected');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 9: Order Cancellation / Refund Reversal
    // -------------------------------------------------------------
    console.log('--- SCENARIO 9: Order Cancellation / Refund Reversal ---');
    // Place order to cancel
    await Cart.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [{ productId: prodLipstickB._id, quantity: 1, price: 500 }],
      },
      { upsert: true, new: true }
    );
    const orderToCancel = await orderService.createOrder(customer._id, {
      shippingAddress: standardShipping,
      paymentMethod: 'COD',
    });
    const suborderToCancel = await VendorOrder.findOne({ parentOrderId: orderToCancel._id });

    // Cancel order
    await platformCommissionService.onOrderCancelled(orderToCancel._id, {
      suborderId: suborderToCancel._id,
      reason: 'Customer requested cancellation',
    });

    const cancelledRefComm = await VendorReferralCommission.findOne({ orderId: orderToCancel._id });
    assert(cancelledRefComm.commissionStatus === 'CANCELLED', 'Referral commission status transitioned to CANCELLED');
    assert(cancelledRefComm.settlementStatus === 'CANCELLED', 'Referral settlementStatus transitioned to CANCELLED');

    // Attempting to payout cancelled commission must fail
    let payoutCancelledThrew = false;
    try {
      await platformCommissionService.processVendorReferralPayout(cancelledRefComm._id);
    } catch (err) {
      payoutCancelledThrew = true;
      assert(err.message.toLowerCase().includes('cancel'), `Payout of cancelled commission rejected with message: "${err.message}"`);
    }
    assert(payoutCancelledThrew === true, 'Payout of cancelled commission blocked');
    console.log('');

    // -------------------------------------------------------------
    // SCENARIO 10: Idempotency & Webhook Duplication Resistance
    // -------------------------------------------------------------
    console.log('--- SCENARIO 10: Idempotency & Webhook Duplication Resistance ---');
    const initialCommCount = await VendorReferralCommission.countDocuments({ orderId: order1._id });

    // Call recordOrderCommission a 2nd and 3rd time
    await platformCommissionService.recordOrderCommission(order1._id);
    await platformCommissionService.recordOrderCommission(order1._id);

    const postCommCount = await VendorReferralCommission.countDocuments({ orderId: order1._id });
    assert(initialCommCount === postCommCount, `No duplicate commission records created: initial=${initialCommCount}, post=${postCommCount}`);

    // Call onOrderDelivered multiple times
    await platformCommissionService.onOrderDelivered(order1._id, { suborderId: suborderB._id });
    await platformCommissionService.onOrderDelivered(order1._id, { suborderId: suborderB._id });

    const finalCommCount = await VendorReferralCommission.countDocuments({ orderId: order1._id });
    assert(finalCommCount === initialCommCount, `Idempotency verified under duplicate delivery events (${finalCommCount} record)`);
    console.log('');

    // -------------------------------------------------------------
    // FINAL REPORT
    // -------------------------------------------------------------
    console.log('========================================================================');
    console.log(`ALL 10 SCENARIOS PASSED! (${passedTests}/${totalTests} assertions passed)`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('\nTEST SUITE FAILED with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
