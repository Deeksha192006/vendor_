import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Percent,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  DollarSign,
  Package,
  Search,
  Info,
  RefreshCw,
  ShoppingBag,
  Users,
  ShieldCheck,
  Calendar,
  Lock,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';

export default function VendorEarnings() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'referrals'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sales metrics
  const [metrics, setMetrics] = useState({
    totalProductSales: 0,
    totalPlatformCommission: 0,
    earningsPendingDelivery: 0,
    earningsEligibleForSettlement: 0,
    totalAmountPaidOut: 0,
    currentPayableBalance: 0,
    refundedReversedAmounts: 0,
    commissionRate: 5,
  });

  const [items, setItems] = useState([]);

  // Referral metrics & transactions
  const [refLoading, setRefLoading] = useState(false);
  const [refMetrics, setRefMetrics] = useState({
    referralCommissionRate: 3,
    totalReferredVendorsCount: 0,
    totalReferredSales: 0,
    totalCommissionEarned: 0,
    pendingDelivery: 0,
    onHold7Days: 0,
    eligibleForPayout: 0,
    totalPaidOut: 0,
    totalCancelled: 0,
    availableBalance: 0,
  });
  const [referredVendors, setReferredVendors] = useState([]);
  const [refTransactions, setRefTransactions] = useState([]);
  const [refStatusFilter, setRefStatusFilter] = useState('ALL');
  const [refSearch, setRefSearch] = useState('');

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/vendor/earnings');
      if (res.data?.data) {
        setMetrics(res.data.data.metrics || {});
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load vendor earnings:', err);
      setError(err.response?.data?.message || 'Failed to load your sales and earnings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      setRefLoading(true);
      const [sumRes, txRes] = await Promise.all([
        api.get('/vendor/referral/commissions/summary'),
        api.get('/vendor/referral/commissions/transactions', { params: { limit: 100 } }),
      ]);
      if (sumRes.data?.data) {
        setRefMetrics(sumRes.data.data.metrics || {});
        setReferredVendors(sumRes.data.data.referredVendors || []);
      }
      if (txRes.data?.data) {
        setRefTransactions(txRes.data.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load vendor referral commissions:', err);
    } finally {
      setRefLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
    fetchReferrals();
  }, []);

  const handleRefresh = () => {
    if (activeTab === 'sales') {
      fetchEarnings();
    } else {
      fetchReferrals();
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.settlementStatus !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.productName?.toLowerCase().includes(q);
      const matchOrder = item.orderNumber?.toLowerCase().includes(q);
      return matchName || matchOrder;
    }
    return true;
  });

  const filteredRefTransactions = refTransactions.filter((tx) => {
    if (refStatusFilter !== 'ALL') {
      if (refStatusFilter === 'ON_HOLD_7_DAYS' && tx.computedHoldStatus !== 'ON_HOLD_7_DAYS') return false;
      if (refStatusFilter !== 'ON_HOLD_7_DAYS' && tx.settlementStatus !== refStatusFilter) return false;
    }
    if (refSearch.trim()) {
      const q = refSearch.toLowerCase();
      const matchOrder = tx.orderNumber?.toLowerCase().includes(q);
      const matchVendor = tx.sellingVendorName?.toLowerCase().includes(q);
      return matchOrder || matchVendor;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Paid Out
          </span>
        );
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" /> Eligible for Settlement
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <RefreshCw className="w-3 h-3 animate-spin" /> Payout Processing
          </span>
        );
      case 'PENDING_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Awaiting Delivery
          </span>
        );
      case 'REVERSED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <RotateCcw className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getRefStatusBadge = (tx) => {
    if (tx.settlementStatus === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" /> Paid Out
        </span>
      );
    }
    if (tx.settlementStatus === 'CANCELLED' || tx.commissionStatus === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          <RotateCcw className="w-3 h-3" /> Cancelled
        </span>
      );
    }
    if (tx.settlementStatus === 'PENDING_DELIVERY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <Clock className="w-3 h-3" /> Awaiting Delivery
        </span>
      );
    }
    if (tx.computedHoldStatus === 'ON_HOLD_7_DAYS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
          <Lock className="w-3 h-3" /> 7-Day Hold Active
        </span>
      );
    }
    if (tx.settlementStatus === 'ELIGIBLE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <CheckCircle2 className="w-3 h-3" /> Ready for Payout
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        {tx.settlementStatus}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ED1C2E] to-[#F7941D] text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Vendor Financial Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Track your direct product sales proceeds and direct vendor referral commissions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading || refLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'sales'
              ? 'bg-[#ED1C2E] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Product Sales & Proceeds (95%)</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'referrals'
              ? 'bg-[#ED1C2E] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Direct Vendor Referrals (3%)</span>
          {refMetrics.totalReferredVendorsCount > 0 && (
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-extrabold ${
                activeTab === 'referrals' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'
              }`}
            >
              {refMetrics.totalReferredVendorsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCT SALES & EARNINGS */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border border-blue-200/80 shadow-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-blue-900 font-bold block mb-0.5">Fixed 5% Platform Commission Policy</strong>
              BAAPOO MART charges a fixed 5% platform commission on eligible vendor product sales. You receive your remaining sales proceeds after successful delivery and settlement eligibility under the 7-day policy.
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Product Sales
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ₹{Number(metrics.totalProductSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Gross sales of all ordered items
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Platform Fee (5%)
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-rose-600">
                ₹{Number(metrics.totalPlatformCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-rose-500/80 mt-1 block">
                Platform commission on delivered sales
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs ring-1 ring-emerald-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Current Payable Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">
                ₹{Number(metrics.currentPayableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600/90 mt-1 block font-medium">
                Eligible proceeds ready for payout
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Amount Paid Out
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ₹{Number(metrics.totalAmountPaidOut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total payouts transferred to bank
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Earnings Pending Delivery
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-700">
                ₹{Number(metrics.earningsPendingDelivery || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-amber-600/90 mt-1 block font-medium">
                Orders currently in transit or awaiting customer delivery confirmation
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Refunded or Reversed Amounts
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-700">
                ₹{Number(metrics.refundedReversedAmounts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Cancelled items and refunded orders
              </span>
            </div>
          </div>

          {/* Order Item Earnings Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product or order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_DELIVERY">Awaiting Delivery</option>
                  <option value="ELIGIBLE">Eligible for Settlement</option>
                  <option value="PROCESSING">Payout Processing</option>
                  <option value="PAID">Paid Out</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REVERSED">Reversed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Sale Amount</th>
                    <th className="py-3 px-4 text-right text-rose-600">Platform Fee (5%)</th>
                    <th className="py-3 px-4 text-right font-extrabold text-emerald-700">Vendor Proceeds</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Delivery Status</th>
                    <th className="py-3 px-4 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ED1C2E]" />
                        Loading your sales and earnings...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        No order item records found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px] truncate" title={item.productName}>
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {item.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                          ₹{Number(item.productSaleAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-600">
                          -₹{Number(item.platformFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-emerald-700 text-sm">
                          ₹{Number(item.vendorEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.deliveryStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(item.settlementStatus)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 text-xs text-slate-500">
              Showing <strong>{filteredItems.length}</strong> items. Settlements follow the platform 7-day settlement policy starting from verified customer delivery.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT VENDOR REFERRAL COMMISSIONS (3%) */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 border border-emerald-200/90 shadow-xs flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <strong className="text-emerald-950 font-bold block text-sm">
                3% Direct Vendor Referral Commission
              </strong>
              <p>
                When vendors you directly refer make eligible product sales, you earn an additional <strong>3% referral commission</strong> on their sales.
                Commissions are credited to your ledger following customer delivery and become eligible for payout after the <strong>7-day holding period</strong>.
              </p>
            </div>
          </div>

          {/* Referral KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Referral Commissions Earned */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs ring-1 ring-emerald-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Referral Commissions Earned
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">
                ₹{Number(refMetrics.totalCommissionEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600/90 mt-1 block font-medium">
                Accrued from referred vendors' sales (3%)
              </span>
            </div>

            {/* In 7-Day Holding Lock */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  In 7-Day Hold Period
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-purple-700">
                ₹{Number(refMetrics.onHold7Days || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-purple-600/80 mt-1 block">
                Delivered orders in 7-day holding window
              </span>
            </div>

            {/* Eligible for Payout */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Eligible for Payout
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-blue-700">
                ₹{Number(refMetrics.eligibleForPayout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-blue-600/80 mt-1 block">
                7-day hold complete, ready for bank release
              </span>
            </div>

            {/* Total Paid Out */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Paid Out
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ₹{Number(refMetrics.totalPaidOut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Settled referral commission payouts
              </span>
            </div>
          </div>

          {/* Section 1: Directly Referred Vendors */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Directly Referred Vendors</h3>
                <p className="text-xs text-slate-500">
                  Vendors who joined BAAPOO MART using your direct referral link / code.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                {referredVendors.length} Referred Vendors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Store Name</th>
                    <th className="py-3 px-4">Owner Name</th>
                    <th className="py-3 px-4">Date Joined</th>
                    <th className="py-3 px-4 text-right">Eligible Sales Generated</th>
                    <th className="py-3 px-4 text-right font-bold text-emerald-700">3% Commission Accrued</th>
                    <th className="py-3 px-4 text-right">Settled Payouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {refLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading referred vendors...
                      </td>
                    </tr>
                  ) : referredVendors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        You have not directly referred any vendors yet. Share your vendor referral link to start earning 3%!
                      </td>
                    </tr>
                  ) : (
                    referredVendors.map((rv) => (
                      <tr key={rv.vendorId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{rv.storeName}</td>
                        <td className="py-3 px-4 text-slate-600">{rv.ownerName}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {rv.joinedAt ? new Date(rv.joinedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          ₹{Number(rv.totalSalesGenerated || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          ₹{Number(rv.totalCommissionAccrued || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-600">
                          ₹{Number(rv.totalCommissionPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Commission History / Settlement Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Commission History & Ledger</h3>
                <p className="text-xs text-slate-500">
                  Individual referral commissions accrued per qualifying sale.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search order or vendor..."
                    value={refSearch}
                    onChange={(e) => setRefSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={refStatusFilter}
                  onChange={(e) => setRefStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ON_HOLD_7_DAYS">7-Day Hold Active</option>
                  <option value="ELIGIBLE">Ready for Payout</option>
                  <option value="PAID">Paid Out</option>
                  <option value="PENDING_DELIVERY">Awaiting Delivery</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Order / Suborder #</th>
                    <th className="py-3 px-4">Referred Vendor</th>
                    <th className="py-3 px-4 text-right">Sale Amount</th>
                    <th className="py-3 px-4 text-center">Rate</th>
                    <th className="py-3 px-4 text-right font-bold text-emerald-700">Commission (₹)</th>
                    <th className="py-3 px-4">Delivered Date</th>
                    <th className="py-3 px-4">7-Day Hold Release Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Payout Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {refLoading ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading referral transactions...
                      </td>
                    </tr>
                  ) : filteredRefTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        No referral commission records found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRefTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                          <div>{tx.orderNumber}</div>
                          {tx.suborderNumber && tx.suborderNumber !== 'N/A' && (
                            <div className="text-[10px] text-slate-400">{tx.suborderNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {tx.sellingVendorName}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                          ₹{Number(tx.eligibleSaleAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-emerald-700">
                          {tx.commissionRate || 3}%
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-emerald-700 text-sm">
                          ₹{Number(tx.commissionAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {tx.deliveredAt ? new Date(tx.deliveredAt).toLocaleDateString('en-IN') : 'Pending'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {tx.eligibleAt ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-purple-500" />
                              <span>{new Date(tx.eligibleAt).toLocaleDateString('en-IN')}</span>
                            </div>
                          ) : (
                            'Pending Delivery'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getRefStatusBadge(tx)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                          {tx.payoutReference || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing <strong>{filteredRefTransactions.length}</strong> referral transactions.</span>
              <span className="text-slate-400">Note: 7-day holding countdown starts from confirmed customer delivery.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
