import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ShieldCheck,
  Store,
  ShoppingBag,
  CreditCard,
  Coins,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  FileText,
  UserPlus,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Crown,
  Award,
  CheckCircle,
  Eye,
  UserCheck,
  Sparkle,
  X,
  Share2,
  Network,
  DollarSign,
  Percent,
  Building2,
  BarChart3,
  Package,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subFilter, setSubFilter] = useState('ALL'); // 'ALL' | 'CUSTOMER' | 'VENDOR'
  const [selectedSub, setSelectedSub] = useState(null);
  const [subModalOpen, setSubModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminService.getDashboardStats();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Super Admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-9 h-9 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Super Admin control center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 max-w-xl mx-auto my-12 text-center shadow-sm">
        <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h3 className="font-bold text-lg mb-1">Access or Loading Error</h3>
        <p className="text-xs mb-4 text-rose-600">{error}</p>
        <button
          onClick={fetchStats}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, roleDistribution, recentAuditLogs, subscriptions } = data || {};
  const customerSubs = subscriptions?.customerSubscriptions || [];
  const vendorSubs = subscriptions?.vendorSubscriptions || [];

  const cards = [
    {
      title: 'Registered Customers',
      value: (metrics?.totalCustomers || 0).toLocaleString(),
      sub: `${metrics?.premiumCustomersCount || 0} Premium VIP • ${metrics?.normalCustomersCount || 0} Normal Plan`,
      icon: UserCheck,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700',
      link: '/super-admin/users?role=USER',
    },
    {
      title: 'Marketplace Vendors',
      value: (metrics?.totalVendors || 0).toLocaleString(),
      sub: `${metrics?.activeVendors || 0} active merchant stores`,
      icon: Store,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700',
      link: '/super-admin/users?role=VENDOR',
    },
    {
      title: 'Active Subscriptions',
      value: (metrics?.totalActiveSubscriptions || 0).toLocaleString(),
      sub: `${metrics?.activeCustomerSubsCount || 0} Customer VIPs • ${metrics?.activeVendorSubsCount || 0} Vendors`,
      icon: Crown,
      color: 'from-[#30358F] to-[#1E2356]',
      bgLight: 'bg-blue-50 text-[#30358F]',
      link: '#subscriptions-section',
    },
    {
      title: 'Catalog Products',
      value: (metrics?.totalProducts || 0).toLocaleString(),
      sub: 'Live marketplace products',
      icon: ShoppingBag,
      color: 'from-[#30358F] to-[#252A68]',
      bgLight: 'bg-indigo-50 text-indigo-700',
      link: '/super-admin/products',
    },
    {
      title: 'Total Orders',
      value: (metrics?.totalOrders || 0).toLocaleString(),
      sub: 'Fulfilled & in-flight orders',
      icon: CreditCard,
      color: 'from-sky-600 to-blue-600',
      bgLight: 'bg-sky-50 text-sky-700',
      link: '/super-admin/orders',
    },
    {
      title: 'Super Admin Sales',
      value: `₹${(metrics?.superAdminProductSales || 0).toLocaleString('en-IN')}`,
      sub: `${metrics?.superAdminProductItemsSold || 0} direct items sold`,
      icon: Package,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700',
      link: '/super-admin/admin-orders',
    },
    {
      title: 'Completed Revenue',
      value: `₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Total completed transactions',
      icon: TrendingUp,
      color: 'from-blue-600 to-emerald-600',
      bgLight: 'bg-blue-50 text-blue-700',
      link: '/super-admin/analytics',
    },
  ];

  // Combined subscription rows
  const allSubscriptionItems = [
    ...customerSubs.map((cs) => ({
      id: cs._id,
      type: 'CUSTOMER',
      user: cs.customerId,
      planName: cs.planId?.name || cs.planSnapshot?.name || 'Customer Subscription Plan',
      price: cs.planId?.price || cs.planSnapshot?.price || 0,
      startedAt: cs.startedAt,
      expiresAt: cs.expiresAt,
      status: cs.status,
    })),
    ...vendorSubs.map((vs) => ({
      id: vs._id,
      type: 'VENDOR',
      user: vs.ownerUserId,
      planName: vs.planId?.name || 'Vendor Subscription Plan',
      price: vs.amount || vs.planId?.price || 0,
      startedAt: vs.startDate,
      expiresAt: vs.endDate,
      status: vs.status,
    })),
  ].sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));

  const filteredSubscriptions = allSubscriptionItems.filter((item) => {
    if (subFilter === 'CUSTOMER') return item.type === 'CUSTOMER';
    if (subFilter === 'VENDOR') return item.type === 'VENDOR';
    return true;
  });

  const openSubInspector = (sub) => {
    setSelectedSub(sub);
    setSubModalOpen(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header & Status Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${metrics?.isMaintenanceMode
                  ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${metrics?.isMaintenanceMode ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {metrics?.isMaintenanceMode ? 'Maintenance Active' : 'Cluster Live & Nominal'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Supreme platform authority, user & vendor directory metrics, active subscriptions, and real-time ledger accounting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/super-admin/sales-report"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md transition"
          >
            <BarChart3 className="w-4 h-4 text-emerald-100" />
            <span>Sales Report</span>
          </Link>
          <Link
            to="/super-admin/subscriptions"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/60 transition shadow-sm"
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>Manage Plans</span>
          </Link>
          <Link
            to="/super-admin/users"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/60 transition shadow-sm"
          >
            <Users className="w-4 h-4" />
            <span>User Directory</span>
          </Link>
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition border border-slate-200 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
            >
              {c.link.startsWith('#') ? (
                <a
                  href={c.link}
                  className="group p-5 bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-purple-300 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between h-full"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                    <div className={`p-2 rounded-xl bg-gradient-to-tr ${c.color} text-white shadow-md shadow-purple-500/10`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">{c.value}</p>
                    <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="truncate">{c.sub}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                </a>
              ) : (
                <Link
                  to={c.link}
                  className="group p-5 bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-blue-300 rounded-2xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between h-full"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                    <div className={`p-2 rounded-xl bg-gradient-to-tr ${c.color} text-white shadow-md shadow-blue-500/10`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">{c.value}</p>
                    <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="truncate">{c.sub}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SUBSCRIPTION REVENUE SUMMARY (Numbers Only KPI Cards)      */}
      {/* ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Subscription Revenue Summary</h2>
              <p className="text-xs text-slate-500">High-level subscription earnings overview across all plans.</p>
            </div>
          </div>
          <Link
            to="/super-admin/sales-report"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            <span>View Full Sales Report</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Subscriptions</span>
              <Store className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                ₹{(metrics?.vendorSubscriptionRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Collected from merchant vendor plans</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Subscriptions</span>
              <Crown className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                ₹{(metrics?.customerSubscriptionRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Collected from customer VIP passes</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Super Admin Product Sales</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-900 font-mono">
                ₹{(metrics?.superAdminProductSales || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-blue-600/80 mt-1">Direct FairKart product sales ({metrics?.superAdminProductItemsSold || 0} items sold)</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Total Subscription Revenue</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <p className="text-3xl font-black font-mono text-emerald-300">
                ₹{(metrics?.totalSubscriptionRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-100/80 mt-1">Combined Vendor + Customer subscriptions</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CUSTOMER PURCHASE ACTIVITY                                 */}
      {/* ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Customer Purchase Activity</h2>
              <p className="text-xs text-slate-500">Real-time stats of distinct purchasing customers across time periods.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
            Purchasing Customers Metrics
          </span>
        </div>

        {/* Purchase Activity Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Purchased Today</span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {(metrics?.customerPurchaseActivity?.customersPurchasedToday || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Active Buyers Today</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Purchased Yesterday</span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {(metrics?.customerPurchaseActivity?.customersPurchasedYesterday || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Previous Day</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Purchased This Week</span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {(metrics?.customerPurchaseActivity?.customersPurchasedThisWeek || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Last 7 Days</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Purchased This Month</span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {(metrics?.customerPurchaseActivity?.customersPurchasedThisMonth || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-purple-600 font-semibold mt-1 block">Current Month</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block mb-1">Total Purchasing Customers</span>
            <p className="text-2xl font-black font-mono">
              {(metrics?.customerPurchaseActivity?.totalPurchasingCustomers || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-100 font-medium mt-1 block">All Time Unique Buyers</span>
          </div>
        </div>

        {/* Daily Customer Purchase Trend Graph Visualizer */}
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Daily Customer Purchase Trend
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Daily Buying Customer Volume</span>
          </div>

          {metrics?.customerPurchaseActivity?.dailyPurchaseTrend?.length > 0 ? (
            <div className="flex items-end gap-2 h-32 pt-4 px-2 overflow-x-auto">
              {metrics.customerPurchaseActivity.dailyPurchaseTrend.map((trend) => {
                const maxVal = Math.max(
                  ...metrics.customerPurchaseActivity.dailyPurchaseTrend.map((t) => t.customerCount || 1),
                  1
                );
                const heightPct = Math.max(12, Math.round(((trend.customerCount || 0) / maxVal) * 100));

                return (
                  <div key={trend.date} className="flex-1 flex flex-col items-center gap-1 min-w-[36px] group">
                    <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {trend.customerCount}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-indigo-400 transition-all shadow-xs"
                      title={`${trend.date}: ${trend.customerCount} customers bought ₹${(trend.totalSales || 0).toLocaleString('en-IN')}`}
                    />
                    <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                      {trend.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No daily purchase activity recorded yet.</p>
          )}
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ACTIVE CUSTOMERS SECTION                                  */}
      {/* ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Customers Intelligence</h2>
              <p className="text-xs text-slate-500">
                Customer activity derived from actual platform activity (logins, orders, browsing).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-extrabold rounded-full border border-purple-200">
            Live Platform Engagement
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Total Registered</span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {(metrics?.activeCustomerStats?.totalRegisteredCustomers || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">All Customers</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70">
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block mb-1">Currently Active</span>
            <p className="text-xl font-black text-emerald-900 font-mono">
              {(metrics?.activeCustomerStats?.currentlyActiveCustomers || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Account Status Active</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/70">
            <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block mb-1">Active Today</span>
            <p className="text-xl font-black text-blue-900 font-mono">
              {(metrics?.activeCustomerStats?.customersActiveToday || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-600 font-bold block mt-1">Logged In / Bought Today</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/70">
            <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider block mb-1">Active This Week</span>
            <p className="text-xl font-black text-purple-900 font-mono">
              {(metrics?.activeCustomerStats?.customersActiveThisWeek || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-purple-600 font-bold block mt-1">Last 7 Days</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/70">
            <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block mb-1">Active This Month</span>
            <p className="text-xl font-black text-indigo-900 font-mono">
              {(metrics?.activeCustomerStats?.customersActiveThisMonth || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-indigo-600 font-bold block mt-1">Current Month Activity</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/70">
            <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block mb-1">Inactive Customers</span>
            <p className="text-xl font-black text-rose-900 font-mono">
              {(metrics?.activeCustomerStats?.inactiveCustomers || 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-rose-600 font-bold block mt-1">Dormant / Suspended</span>
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* SUPER ADMIN EARNINGS & CUSTOMER/VENDOR BREAKDOWN SECTION      */}
      {/* ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Super Admin Revenue & Segment Intelligence</h2>
              <p className="text-xs text-slate-500">Real-time earnings breakdown from Customers, Vendors, and Referral Network.</p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-amber-400 text-xs font-black shadow-md flex items-center gap-2 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Total Earnings: ₹{(metrics?.totalSuperAdminEarnings || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Customer Intelligence & Premium Counts */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
              <UserCheck className="w-48 h-48 text-blue-400" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                  Customer Directory
                </span>
                <Crown className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  {(metrics?.totalCustomers || 0).toLocaleString()}
                </div>
                <div className="text-xs text-blue-200/80 font-semibold mt-0.5">Total Registered Customers</div>
              </div>

              <div className="space-y-2 pt-2 border-t border-blue-800/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 flex items-center gap-1.5 font-bold">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Premium VIP Customers:
                  </span>
                  <span className="font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    {metrics?.premiumCustomersCount || 0} Users
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-200 font-bold">Regular / Free Customers:</span>
                  <span className="font-extrabold text-blue-100">
                    {metrics?.normalCustomersCount || 0} Users
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-800/60 font-black text-sm text-emerald-300">
                  <span>Earned from Customers:</span>
                  <span className="font-mono">₹{(metrics?.customerSubscriptionRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <Link
              to="/super-admin/users?role=USER"
              className="relative z-10 mt-5 pt-3 border-t border-blue-800/60 flex items-center justify-between text-xs font-bold text-blue-300 hover:text-white transition"
            >
              <span>Manage Customer Profiles</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Vendor Intelligence & Earnings Breakdown */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
              <Store className="w-48 h-48 text-emerald-400" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                  Vendor Marketplace
                </span>
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  {(metrics?.totalVendors || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">Total Onboarded Vendors</div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Active Stores:</span>
                  <span className="font-extrabold text-emerald-400">
                    {metrics?.activeVendors || 0} Stores
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Vendor Store Subscriptions:</span>
                  <span className="font-extrabold text-white font-mono">
                    ₹{(metrics?.vendorSubscriptionRevenue || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Sales Order Commissions:</span>
                  <span className="font-extrabold text-white font-mono">
                    ₹{(metrics?.vendorOrderCommission || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-black text-sm text-emerald-400">
                  <span>Total Earned from Vendors:</span>
                  <span className="font-mono">₹{(metrics?.vendorTotalEarnings || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <Link
              to="/super-admin/users?role=VENDOR"
              className="relative z-10 mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>View Vendor Directory & Revenue</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: ⭐ Referral Network Platform Earnings (CRITICAL) */}
          <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-amber-500/30">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
              <Share2 className="w-48 h-48 text-amber-400" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
                  <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Referral Network Earnings</span>
                </span>
                <Network className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <div className="text-3xl font-black tracking-tight text-amber-300 font-mono">
                  ₹{(metrics?.referralEarnings || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-amber-100/80 font-bold mt-0.5">
                  Super Admin Revenue Earned from Referral Network
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-amber-800/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-amber-100/90 font-bold">Total Network Members:</span>
                  <span className="font-black text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/20">
                    {(metrics?.totalReferralsCount || 0).toLocaleString()} Users
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-amber-100/90 font-bold">Referral Network Overrides:</span>
                  <span className="font-extrabold text-white">9-Level Hierarchy</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-100/80 leading-relaxed font-medium">
                  Direct revenue accrued from referral subscriptions, partner pairing overrides, and 9-level network commission cuts.
                </div>
              </div>
            </div>

            <Link
              to="/super-admin/referral-network"
              className="relative z-10 mt-5 pt-3 border-t border-amber-800/60 flex items-center justify-between text-xs font-black text-amber-300 hover:text-white transition"
            >
              <span>Explore 9-Level Referral Network</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ACTIVE SUBSCRIPTIONS TRACKER TABLE (User & Vendor Subscriptions) */}
      <motion.div
        id="subscriptions-section"
        variants={itemVariants}
        className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-purple-100 text-purple-700">
                <Crown className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">Paid Customers & Subscribers Directory</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                {allSubscriptionItems.length} Subscribed Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Audit of all paid customer membership plans and merchant vendor subscriptions across the application.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setSubFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${subFilter === 'ALL'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All ({allSubscriptionItems.length})
            </button>
            <button
              onClick={() => setSubFilter('CUSTOMER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${subFilter === 'CUSTOMER'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Paid Customers ({customerSubs.length})
            </button>
            <button
              onClick={() => setSubFilter('VENDOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${subFilter === 'VENDOR'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Vendors ({vendorSubs.length})
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Paid Customer / User</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((sub) => {
                  const subscriberName = sub.user?.name || 'User Account';
                  const subscriberEmail = sub.user?.email || 'N/A';
                  const subscriberPhone = sub.user?.phone || '';
                  const roleBadge =
                    sub.type === 'CUSTOMER' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        <Users className="w-3 h-3" /> CUSTOMER
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Store className="w-3 h-3" /> VENDOR
                      </span>
                    );

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {subscriberName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{subscriberName}</p>
                            <p className="text-[11px] text-slate-500">{subscriberEmail}</p>
                            {subscriberPhone && <p className="text-[10px] text-slate-400 font-mono">{subscriberPhone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{roleBadge}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-purple-900">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span>{sub.planName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{sub.price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Lifetime / Active'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> ACTIVE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openSubInspector(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition border border-purple-200/60 shadow-xs"
                          title="View Paid Customer Details"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Paid Customer
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <Crown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-slate-700">No active paid subscriptions found for this filter.</p>
                    <p className="text-[11px] text-slate-400">Users and Vendors who subscribe to plans will automatically appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Two Column Section: Role Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Role Distribution
            </h3>
            <Link to="/super-admin/roles" className="text-xs text-blue-600 font-bold hover:underline">
              Matrix
            </Link>
          </div>
          <div className="space-y-2.5">
            {roleDistribution &&
              Object.entries(roleDistribution).map(([roleName, count]) => (
                <div
                  key={roleName}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-blue-200 transition"
                >
                  <span className="text-xs font-bold text-slate-700">{roleName}</span>
                  <span className="text-xs font-mono font-black text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Recent Audit Activity Stream */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Recent Audit Trail
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {recentAuditLogs && recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-blue-200 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-md font-mono">
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        by {log.userId?.name || 'Super Admin'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Entity: <span className="font-semibold text-slate-700">{log.entity}</span> {log.entityId ? `#${log.entityId}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No recent audit events recorded.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* PAID CUSTOMER PROFILE INSPECTOR MODAL */}
      {subModalOpen && selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-5"
          >
            <button
              onClick={() => setSubModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                {selectedSub.user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                  Paid {selectedSub.type} Subscriber
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedSub.user?.name || 'Customer Account'}</h3>
                <p className="text-xs text-slate-500">{selectedSub.user?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Paid Subscription Detail Box */}
            <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-purple-200/60">
                <span className="text-xs text-slate-600 font-semibold">Subscription Plan Paid:</span>
                <span className="text-sm font-black text-purple-900 flex items-center gap-1">
                  <Award className="w-4 h-4 text-purple-600" />
                  {selectedSub.planName}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-purple-200/60">
                <span className="text-xs text-slate-600 font-semibold">Amount Paid:</span>
                <span className="text-base font-black text-slate-900 font-mono">₹{selectedSub.price.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-purple-200/60">
                <span className="text-xs text-slate-600 font-semibold">Subscription Expiry:</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {selectedSub.expiresAt ? new Date(selectedSub.expiresAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Active VIP'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600 font-semibold">Payment Status:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" /> PAID & ACTIVE
                </span>
              </div>
            </div>

            {/* User Profile Overview */}
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">Subscriber Contact Info</h4>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-400 block text-[10px]">Mobile Phone</span>
                  <span className="font-bold text-slate-800">{selectedSub.user?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Role</span>
                  <span className="font-bold text-slate-800">{selectedSub.user?.role || selectedSub.type}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSubModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close Window
              </button>
              {selectedSub.user?.email && (
                <Link
                  to={`/super-admin/users?search=${encodeURIComponent(selectedSub.user.email)}`}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>Full 360 Profile</span>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
export default SuperAdminDashboard;
