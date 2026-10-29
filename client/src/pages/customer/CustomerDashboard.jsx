import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Wallet,
  Package,
  ArrowRight,
  Copy,
  Check,
  Tag,
  CreditCard,
  Gift,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data?.data) {
          setOrders(Array.isArray(res.data.data) ? res.data.data.slice(0, 4) : []);
        }
      } catch (err) {
        // Fallback or empty
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleCopyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fairCoins = user?.fairCoinBalance ?? 0;
  const superCoins = user?.superCoinBalance ?? 0;
  const referralCode = user?.referralCode || 'BAAPOOMART';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Subscription Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#30358F] via-[#252972] to-[#ED1C2E] text-white p-6 md:p-8 shadow-xl shadow-indigo-900/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#F7941D]" />
              <span>BUY INDIAN • BUILD INDIA</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Customer'}!
            </h1>
            <p className="text-white/80 text-xs md:text-sm mt-1 max-w-xl">
              Earn reward coins on every purchase, spin the wheel daily, and support verified Indian manufacturers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop Products</span>
            </Link>
            <Link
              to="/customer/subscription"
              className="px-5 py-2.5 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white border border-blue-400/30 font-bold text-xs transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>VIP Plans</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fair Coins */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Fair Coins</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{fairCoins}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Marketplace Coins</span>
              <Link to="/customer/spin" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                Spin Wheel <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Fair Coins Rupee Value */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Fair Coins Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">₹{(fairCoins * 0.1).toFixed(2)}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Checkout Discount</span>
              <Link to="/customer/wallet" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                Wallet <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">My Orders</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{orders.length}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Completed & In-Transit</span>
              <Link to="/customer/orders" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Referral Code */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Referral Code</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="font-black text-slate-900 font-mono text-sm tracking-wider">{referralCode}</span>
              <button
                onClick={handleCopyReferral}
                className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500">Share with Friends</span>
              <Link to="/customer/referrals" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                Network <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Recent Purchases</h3>
              <p className="text-xs text-slate-500">Track and view your recent marketplace orders</p>
            </div>
            <Link
              to="/customer/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>See All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No orders placed yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Explore our wide catalog of multi-vendor products</p>
              <Link
                to="/products"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <div key={order._id || order.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-bold text-xs">
                      #{order.orderNumber?.slice(-4) || 'ORD'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {order.items?.length || 1} item(s) • ₹{(order.totalAmount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      {order.orderStatus || 'CONFIRMED'}
                    </span>
                    <Link
                      to={`/account/orders/${order._id || order.id}`}
                      className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Rewards Banner */}
        <div className="space-y-6">
          {/* Rewards Spin Promotion */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20 font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-amber-950">Daily Spin & Win</h4>
            <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
              Try your luck on the BAAPOO MART Lucky Spin Wheel and win reward coins and order discounts every day!
            </p>
            <Link
              to="/customer/spin"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <span>Spin The Wheel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Offline Bills Upload Banner */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 font-black">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">Upload Offline Store Bills</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bought from a partnered local store? Upload the receipt bill to claim reward coins automatically.
            </p>
            <Link
              to="/customer/offline-bills"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              <span>Upload Receipt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
