import { VendorSettlement } from '../models/VendorSettlement.js';
import { VendorWithdrawal } from '../models/VendorWithdrawal.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { adminService } from './adminService.js';
import { AuditLog } from '../models/AuditLog.js';

export const settlementService = {
  async processEligibleSettlements(adminUserId, adminIp) {
    // 1. Find all ELIGIBLE settlements whose 7-day hold period has expired
    const now = new Date();
    const candidateSettlements = await VendorSettlement.find({
      status: 'ELIGIBLE',
      eligibleAt: { $lte: now }
    }).populate('suborderId');

    // Filter out settlements affected by cancellation, refund, or hold
    const eligibleSettlements = candidateSettlements.filter(st => {
      const suborder = st.suborderId;
      if (suborder && ['CANCELLED', 'RETURNED', 'REFUNDED'].includes(suborder.status)) {
        return false;
      }
      return true;
    });

    if (eligibleSettlements.length === 0) {
      return { message: 'No eligible settlements to process', processedCount: 0 };
    }

    // 2. Group by vendor
    const vendorGroups = {};
    for (const st of eligibleSettlements) {
      if (!vendorGroups[st.vendorId]) {
        vendorGroups[st.vendorId] = [];
      }
      vendorGroups[st.vendorId].push(st);
    }

    let processedCount = 0;
    const batchId = `SB-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${Date.now()}`;

    // 3. Create VendorWithdrawal (payout request) per vendor
    for (const [vendorId, settlements] of Object.entries(vendorGroups)) {
      const totalPayable = settlements.reduce((sum, s) => sum + s.netPayable, 0);

      // Create Payout Request
      const withdrawal = await VendorWithdrawal.create({
        vendorId,
        amount: totalPayable,
        status: 'PENDING', // Ready for manual payout or automated gateway payout
        adminNotes: `Batch: ${batchId}`
      });

      // Update settlements to PROCESSING
      for (const st of settlements) {
        st.status = 'PROCESSING';
        st.payoutReference = withdrawal._id.toString();
        st.notes = `Included in Batch: ${batchId}`;
        await st.save();
      }

      // Add debit to vendor ledger indicating money is being transferred out
      const lastLedger = await VendorLedger.findOne({ vendorId }).sort({ createdAt: -1 });
      const currentBalance = lastLedger ? lastLedger.balanceSnapshot : 0;
      const newBalance = currentBalance - totalPayable;

      await VendorLedger.create({
        vendorId,
        transactionType: 'PAYOUT',
        debit: totalPayable,
        balanceSnapshot: newBalance,
        description: `Batch Settlement ${batchId}`,
        referenceId: withdrawal._id.toString()
      });

      processedCount++;
    }

    await AuditLog.create({
      userId: adminUserId,
      action: 'PROCESS_SETTLEMENT_BATCH',
      entity: 'VendorSettlement',
      entityId: batchId,
      newValue: `Processed ${processedCount} vendors`,
      ipAddress: adminIp
    });

    return {
      message: 'Settlement batch processed successfully',
      batchId,
      processedCount
    };
  }
};
