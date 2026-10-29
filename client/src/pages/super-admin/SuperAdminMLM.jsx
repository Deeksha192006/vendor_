import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Search,
  Users,
  Award,
  Coins,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  PieChart,
  Wallet,
  Receipt,
  UserCheck,
  Copy,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// Recursive Tree Node Component for One-to-Many Referral Tree
const TreeNode = ({ node, isRoot = false, referralType = 'VENDOR' }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node?.children && node.children.length > 0;
  const isVendor = referralType === 'VENDOR';

  if (!node) return null;

  return (
    <div className="flex flex-col items-center my-2">
      {/* Node Card */}
      <div
        className={`relative group rounded-xl p-4 transition-all duration-200 border shadow-sm ${
          isRoot
            ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-700 ring-4 ring-indigo-500/20 min-w-[280px]'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300 hover:shadow-md min-w-[260px]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isRoot
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                  : isVendor
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {isRoot ? (
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              ) : isVendor ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm leading-tight ${isRoot ? 'text-white' : 'text-slate-900'}`}>
                  {node.name || 'Unnamed User'}
                </span>
                {isRoot && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/40 text-indigo-200 rounded-full border border-indigo-400/40">
                    Root
                  </span>
                )}
              </div>
              {node.storeName && (
                <p className={`text-xs ${isRoot ? 'text-indigo-200' : 'text-slate-500'}`}>{node.storeName}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isRoot ? 'bg-indigo-950/60 text-indigo-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {node.referralCode || 'NO-CODE'}
                </span>
              </div>
            </div>
          </div>

          {/* Children count badge */}
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              isRoot
                ? 'bg-indigo-500/30 text-indigo-200'
                : node.directCount > 0
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {node.directCount || 0} direct
          </span>
        </div>

        {/* Relationship Status & Rewards info if not root */}
        {!isRoot && node.relationship && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex flex-wrap items-center justify-between gap-1 text-slate-600">
            {isVendor ? (
              <>
                <span className="font-medium text-slate-500">
                  Plan: <span className="text-slate-800 font-semibold">{node.relationship.planName || 'Pending'}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    node.relationship.commissionStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {node.relationship.commissionStatus === 'PAID'
                    ? `₹${node.relationship.commissionAmount} (10%)`
                    : 'Unpaid Plan'}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium text-slate-500">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      node.relationship.qualificationStatus === 'QUALIFIED' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {node.relationship.qualificationStatus}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-500" />
                  {node.relationship.superCoinsAwarded || 500} Coins
                </span>
              </>
            )}
          </div>
        )}

        {/* Expand / Collapse Button if has children */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Collapse Direct Referrals ({node.children.length})
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5" /> Expand Direct Referrals ({node.children.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Children branches (One-to-Many: Multiple Children under Single Parent) */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical connector line */}
          <div className="w-0.5 h-6 bg-indigo-300"></div>

          {/* Horizontal branching connector bar */}
          <div className="flex justify-center items-start gap-6 relative px-4 w-full overflow-x-auto pb-4">
            {node.children.map((child, idx) => (
              <div key={child.id || idx} className="flex flex-col items-center relative">
                {/* Connector line down to child */}
                <div className="w-0.5 h-4 bg-indigo-300"></div>
                <TreeNode node={child} isRoot={false} referralType={referralType} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SuperAdminMLM = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'customers' | 'tree' | 'financial'

  // Vendor Referrals state
  const [vendorList, setVendorList] = useState([]);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorLoading, setVendorLoading] = useState(false);

  // Customer Referrals state
  const [customerList, setCustomerList] = useState([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);

  // Tree state
  const [treeType, setTreeType] = useState('VENDOR'); // 'VENDOR' | 'CUSTOMER'
  const [treeSearch, setTreeSearch] = useState('');
  const [treeData, setTreeData] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);

  // Global error
  const [error, setError] = useState('');

  // 1. Load Summary Metrics
  const loadSummary = async () => {
    try {
      setError('');
      const data = await superAdminService.getMlmSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load MLM summary:', err);
      setError(err.response?.data?.message || 'Failed to load referral summary metrics');
    }
  };

  // 2. Load Vendor Referrals List
  const loadVendorReferrals = async (page = 1, search = '') => {
    try {
      setVendorLoading(true);
      const data = await superAdminService.getVendorReferrals({ page, limit: 15, search });
      setVendorList(data?.referrals || []);
      setVendorTotal(data?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load vendor referrals:', err);
    } finally {
      setVendorLoading(false);
    }
  };

  // 3. Load Customer Referrals List
  const loadCustomerReferrals = async (page = 1, search = '') => {
    try {
      setCustomerLoading(true);
      const data = await superAdminService.getCustomerReferrals({ page, limit: 15, search });
      setCustomerList(data?.referrals || []);
      setCustomerTotal(data?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load customer referrals:', err);
    } finally {
      setCustomerLoading(false);
    }
  };

  // 4. Load One-to-Many Referral Tree
  const loadTree = async (search = '', type = treeType) => {
    try {
      setTreeLoading(true);
      const data = await superAdminService.getOneToManyTree({ search, referralType: type, maxDepth: 4 });
      setTreeData(data?.tree || null);
    } catch (err) {
      console.error('Failed to load referral tree:', err);
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadSummary(), loadVendorReferrals(1), loadCustomerReferrals(1), loadTree('', 'VENDOR')]);
      setLoading(false);
    };
    init();
  }, []);

  const handleVendorSearch = (e) => {
    e.preventDefault();
    setVendorPage(1);
    loadVendorReferrals(1, vendorSearch);
  };

  const handleCustomerSearch = (e) => {
    e.preventDefault();
    setCustomerPage(1);
    loadCustomerReferrals(1, customerSearch);
  };

  const handleTreeSearch = (e) => {
    e.preventDefault();
    loadTree(treeSearch, treeType);
  };

  const handleTreeTypeChange = (newType) => {
    setTreeType(newType);
    loadTree(treeSearch, newType);
  };

  const cards = summary?.cards || {
    totalVendorReferrals: 0,
    qualifiedVendorReferrals: 0,
    totalVendorSubscriptionPayments: 0,
    totalVendorReferralCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalCustomerReferrals: 0,
    qualifiedCustomerReferrals: 0,
    totalSuperCoinsAwarded: 0,
    reversedRewards: 0,
  };

  const fin = summary?.financialSummary || {
    eligibleSubscriptionPayments: 0,
    directVendorReferralCommissions: 0,
    remainingSubscriptionProceeds: 0,
    commissionPayouts: 0,
    customerSuperCoinsAwarded: 0,
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Referral Management</h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> One-to-Many Architecture
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Monitor vendor subscription commissions (10%), customer Super Coins rewards (500 coins), and recursive
              hierarchies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadSummary();
              if (activeTab === 'vendors') loadVendorReferrals(vendorPage, vendorSearch);
              if (activeTab === 'customers') loadCustomerReferrals(customerPage, customerSearch);
              if (activeTab === 'tree') loadTree(treeSearch, treeType);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 10 Summary Cards Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Total Vendor Referrals */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Vendor Referrals</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{cards.totalVendorReferrals.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total registered vendor invites</div>
        </motion.div>

        {/* Card 2: Qualified Vendor Referrals */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualified Vendor Referrals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{cards.qualifiedVendorReferrals.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Purchased eligible subscription</div>
        </motion.div>

        {/* Card 3: Total Vendor Subscription Payments */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Sub. Payments</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-900">₹{cards.totalVendorSubscriptionPayments.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total subscription proceeds</div>
        </motion.div>

        {/* Card 4: Total Vendor Referral Commissions (10%) */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-violet-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Commissions (10%)</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-violet-700">₹{cards.totalVendorReferralCommissions.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">10% direct commissions awarded</div>
        </motion.div>

        {/* Card 5: Pending Commissions */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Commissions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">₹{cards.pendingCommissions.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting settlement or plan</div>
        </motion.div>

        {/* Card 6: Paid Commissions */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Commissions</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-700">₹{cards.paidCommissions.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Successfully credited to wallets</div>
        </motion.div>

        {/* Card 7: Total Customer Referrals */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customer Referrals</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{cards.totalCustomerReferrals.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Invited customers registered</div>
        </motion.div>

        {/* Card 8: Qualified Customer Referrals */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualified Customer Refs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{cards.qualifiedCustomerReferrals.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Eligible for Super Coins</div>
        </motion.div>

        {/* Card 9: Total Super Coins Awarded (500 coins/ref) */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Super Coins Awarded</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{cards.totalSuperCoinsAwarded.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">500 coins per qualified invite</div>
        </motion.div>

        {/* Card 10: Reversed Rewards */}
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reversed Rewards</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{cards.reversedRewards.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Refunded / reversed rewards</div>
        </motion.div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'vendors'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Vendor Referrals
          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-semibold">
            {cards.totalVendorReferrals}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'customers'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Customer Referrals
          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-semibold">
            {cards.totalCustomerReferrals}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'tree'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-4 h-4" /> Referral Tree (One-to-Many)
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'financial'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" /> Financial Summary
        </button>
      </div>

      {/* Tab 1: Vendor Referrals */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <form onSubmit={handleVendorSearch} className="flex items-center gap-2 w-full sm:w-96">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search vendor name, store, or referral code..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
            </form>
            <div className="text-xs text-slate-500 font-medium">
              Showing {vendorList.length} of {vendorTotal} vendor referrals
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Referring Vendor</th>
                    <th className="py-3 px-4">Referred Vendor</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4">Sub. Amount</th>
                    <th className="py-3 px-4">Commission Rate</th>
                    <th className="py-3 px-4">Commission Earned</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Commission Status</th>
                    <th className="py-3 px-4">Referral Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorLoading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading vendor referrals...
                      </td>
                    </tr>
                  ) : vendorList.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        No vendor referrals recorded yet.
                      </td>
                    </tr>
                  ) : (
                    vendorList.map((ref) => (
                      <tr key={ref._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ref.referrerId?.name || 'Direct / System'}</div>
                          {ref.referrerStoreName && (
                            <div className="text-xs text-slate-500">{ref.referrerStoreName}</div>
                          )}
                          <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                            {ref.referrerId?.referralCode || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ref.referredUserId?.name || 'Unknown'}</div>
                          {ref.referredStoreName && (
                            <div className="text-xs text-slate-500">{ref.referredStoreName}</div>
                          )}
                          <div className="text-[11px] font-mono text-slate-500">
                            {ref.referredUserId?.referralCode || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {ref.planName || 'Vendor Subscription'}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          ₹{(ref.subscriptionAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-600">
                          {ref.commissionRate || 10}%
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-600">
                          ₹{(ref.commissionAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              ref.qualificationStatus === 'QUALIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ref.qualificationStatus === 'QUALIFIED' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              ref.commissionStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ref.commissionStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {ref.commissionStatus || 'NONE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                          {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Customer Referrals */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <form onSubmit={handleCustomerSearch} className="flex items-center gap-2 w-full sm:w-96">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search customer name or referral code..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
            </form>
            <div className="text-xs text-slate-500 font-medium">
              Showing {customerList.length} of {customerTotal} customer referrals
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Referring Customer</th>
                    <th className="py-3 px-4">Referred Customer</th>
                    <th className="py-3 px-4">Referral Date</th>
                    <th className="py-3 px-4">Qualification Status</th>
                    <th className="py-3 px-4">Super Coins Awarded</th>
                    <th className="py-3 px-4">Reward Txn ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading customer referrals...
                      </td>
                    </tr>
                  ) : customerList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No customer referrals recorded yet.
                      </td>
                    </tr>
                  ) : (
                    customerList.map((ref) => (
                      <tr key={ref._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ref.referrerId?.name || 'Customer'}</div>
                          <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                            {ref.referrerId?.referralCode || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ref.referredUserId?.name || 'New Customer'}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {ref.referredUserId?.referralCode || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                          {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              ref.qualificationStatus === 'QUALIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ref.qualificationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-amber-600 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-500" />
                          {ref.superCoinsAwarded || 500} Super Coins
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          {ref.rewardTransactionId || 'TXN-AUTO-CREDIT'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: One-to-Many Referral Tree */}
      {activeTab === 'tree' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            {/* Tree Type Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleTreeTypeChange('VENDOR')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  treeType === 'VENDOR' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Vendor Referral Tree
              </button>
              <button
                onClick={() => handleTreeTypeChange('CUSTOMER')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  treeType === 'CUSTOMER' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Customer Referral Tree
              </button>
            </div>

            {/* Tree Search */}
            <form onSubmit={handleTreeSearch} className="flex items-center gap-2 w-full sm:w-96">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={`Search ${treeType.toLowerCase()} by name, code or email...`}
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Explore
              </button>
            </form>
          </div>

          {/* Tree Visualization Container */}
          <div className="bg-slate-50/60 p-8 rounded-2xl border border-slate-200 min-h-[500px] overflow-x-auto flex flex-col items-center justify-start">
            {treeLoading ? (
              <div className="my-auto py-20 flex flex-col items-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                <p className="font-semibold text-sm">Building one-to-many referral hierarchy...</p>
              </div>
            ) : !treeData ? (
              <div className="my-auto py-20 text-center text-slate-400">
                <Network className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-sm">No referral hierarchy found for this search.</p>
                <p className="text-xs text-slate-400 mt-1">Try searching for a different referral code or name.</p>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <TreeNode node={treeData} isRoot={true} referralType={treeType} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Financial Summary */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subscription Revenue & Commission Split */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Vendor Subscriptions Split</h3>
                  <p className="text-xs text-slate-500">10% direct commission vs Super Admin retained</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-600">Eligible Subscription Payments</span>
                  <span className="font-black text-slate-900 text-lg">
                    ₹{fin.eligibleSubscriptionPayments.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-violet-50 rounded-xl">
                  <span className="text-sm font-semibold text-violet-700">Direct Vendor Referral Commissions (10%)</span>
                  <span className="font-black text-violet-700 text-lg">
                    - ₹{fin.directVendorReferralCommissions.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-sm font-bold text-emerald-800">Super Admin Remaining Proceeds</span>
                  <span className="font-black text-emerald-700 text-xl">
                    ₹{fin.remainingSubscriptionProceeds.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                Calculations represent eligible subscription amounts paid by referred vendors. Taxes, refunds, and gateway
                fees are adjusted separately in the master ledger.
              </div>
            </div>

            {/* Customer Super Coins Summary */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Customer Referral Rewards</h3>
                  <p className="text-xs text-slate-500">500 Super Coins per qualified invite</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-600">Reward Per Direct Invite</span>
                  <span className="font-black text-amber-600 text-lg">500 Super Coins</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm font-semibold text-amber-800">Total Coins Awarded</span>
                  <span className="font-black text-amber-700 text-xl">
                    {fin.customerSuperCoinsAwarded.toLocaleString()} Coins
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-600">Reward Currency</span>
                  <span className="font-bold text-slate-800 text-sm">Super Coins Wallet</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                Customer Super Coins rewards are strictly isolated in the Super Coins ledger and never mingled with vendor
                cash commission balances.
              </div>
            </div>

            {/* Program Policies & Rules Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">One-to-Many Architecture</h3>
                  <p className="text-xs text-indigo-200">Active Enforcement Rules</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-indigo-100/90 leading-relaxed pt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>One vendor or customer can refer unlimited direct people.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Each referred account belongs to exactly one direct referrer.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Vendor commissions are strictly 10% on direct vendor subscriptions.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Customer rewards are fixed at 500 Super Coins per qualified invite.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Self-referrals, cross-type mixing, and circular trees are prevented.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminMLM;
