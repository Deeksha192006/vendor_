import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Store,
  DollarSign,
  Package,
  Plus,
  Loader2,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  Truck,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VendorDashboard = () => {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [prodForm, setProdForm] = useState({ name: '', price: '', description: '' });

  const fetchVendorData = async () => {
    try {
      const res = await api.get('/vendor/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading vendor dashboard data:', err);
    }
  };

  const fetchVendorOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await api.get('/vendor/orders');
      if (res.data?.success) {
        setOrders(res.data.data.orders || []);
      }
    } catch (err) {
      console.error('Error loading vendor orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchVendorData(), fetchVendorOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUpdateOrderStatus = async (orderId, action) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.post(`/vendor/orders/${orderId}/${action}`);
      if (res.data?.success) {
        await Promise.all([fetchVendorData(), fetchVendorOrders()]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePayActivation = async () => {
    try {
      setIsPaying(true);
      const res = await api.post('/vendor/pay-activation', {
        paymentMethod: 'RAZORPAY',
        transactionId: `rzp_act_${Date.now()}`
      });
      if (res.data?.success) {
        setShowPaymentModal(false);
        alert('Platform activation payment of ₹1,999 completed successfully! All vendor features are now fully unlocked.');
        loadAll();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!vendor?.isPaid && vendor?.paymentStatus !== 'PAID') {
      setShowPaymentModal(true);
      return;
    }
    try {
      await api.post('/products', prodForm);
      setShowProductModal(false);
      setProdForm({ name: '', price: '', description: '' });
      loadAll();
      alert('Product created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!vendor?.isPaid && vendor?.paymentStatus !== 'PAID') {
      setShowPaymentModal(true);
      return;
    }
    try {
      await api.post('/finance/withdraw', { amount: Number(withdrawAmount) });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      loadAll();
      alert('Withdrawal request submitted for Admin review!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error requesting withdrawal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading store dashboard...</span>
      </div>
    );
  }

  const { vendor, stats } = data || {};
  const isVendorPaid = vendor?.isPaid || vendor?.paymentStatus === 'PAID';

  // Calculate Order Management Counts
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter((o) => ['CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status)).length;
  const readyToShipCount = orders.filter((o) => o.status === 'READY_TO_SHIP').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const filteredOrders = orders.filter((o) => {
    const matchFilter = orderFilter === 'ALL' || o.status === orderFilter;
    const matchSearch =
      !orderSearch ||
      o.subOrderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
      PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      PACKED: 'bg-purple-50 text-purple-700 border-purple-200',
      READY_TO_SHIP: 'bg-orange-50 text-orange-700 border-orange-200',
      SHIPPED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${styles[status] || styles.PENDING}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Vendor Unpaid Alert Banner */}
      {!isVendorPaid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  Payment Required
                </span>
                <span className="text-xs font-bold text-amber-700">Account Options Disabled</span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Vendor Platform Registration Fee Pending (₹1,999)
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Platform features (such as <strong>Add New Product</strong>, <strong>Inventory Publishing</strong>, and <strong>Payout Withdrawals</strong>) are locked until you complete your platform activation payment to Super Admin.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay ₹1,999 to Unlock Platform</span>
          </button>
        </motion.div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-700/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold shadow-md">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isVendorPaid ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Paid & Active Merchant
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Unpaid: Activation Needed
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{vendor?.storeName || 'Merchant Store'}</h1>
              <p className="text-blue-100 text-xs mt-0.5">Manage products, customer orders & revenue growth</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadAll}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>

            <Link
              to="/vendor/finance"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
            >
              Finance & Ledger
            </Link>

            <button
              onClick={() => {
                if (!isVendorPaid) {
                  setShowPaymentModal(true);
                } else {
                  setShowProductModal(true);
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 ${
                isVendorPaid
                  ? 'bg-white text-blue-700 hover:bg-blue-50 cursor-pointer'
                  : 'bg-amber-400 text-amber-950 hover:bg-amber-300 cursor-pointer ring-2 ring-amber-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isVendorPaid ? 'Add New Product' : 'Add Product (Activation Required)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{(stats?.totalSales || 0).toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total revenue generated</p>
        </motion.div>

        {/* Payout Balance */}
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">Available Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{(stats?.totalEarnings || 0).toLocaleString()}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">Ready for withdrawal</span>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Request Payout
            </button>
          </div>
        </motion.div>

        {/* Total Orders */}
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">Store Orders</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{orders.length || stats?.totalOrders || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Processed order items</p>
        </motion.div>

        {/* Active Products */}
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">Catalog Products</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.productsCount || 0}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">Active in Marketplace</span>
            <Link to="/vendor/products" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ============================================================== */}
      {/* ORDER MANAGEMENT SECTION (Embedded Order Dashboard)           */}
      {/* ============================================================== */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Management</h2>
            <p className="text-xs text-slate-500">Manage, pack, and fulfill your customer orders with ease</p>
          </div>
          <button
            onClick={fetchVendorOrders}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Order Status Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-2xl border text-amber-600 bg-amber-50 border-amber-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Pending Orders</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-2xl border text-blue-600 bg-blue-50 border-blue-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Processing</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{processingCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-2xl border text-orange-600 bg-orange-50 border-orange-200">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Ready to Ship</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{readyToShipCount}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-2xl border text-emerald-600 bg-emerald-50 border-emerald-200">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Delivered</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{deliveredCount}</h3>
            </div>
          </div>
        </div>

        {/* Interactive Order Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search Sub-Order / Customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_TO_SHIP', 'DELIVERED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    orderFilter === f
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Sub-Order</th>
                  <th className="px-5 py-3.5 font-bold">Customer</th>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-5 py-3.5 font-bold">Items</th>
                  <th className="px-5 py-3.5 font-bold">Amount</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                      Loading order records...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No orders matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-blue-600 font-bold">{order.subOrderNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ID: #{order._id?.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{order.shippingAddress?.fullName || 'Customer'}</div>
                        <div className="text-[10px] text-slate-500">
                          {order.shippingAddress?.city || ''}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-900">
                        ₹{(order.itemsSubtotal || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Workflow Action Buttons */}
                          {order.status === 'PENDING' && (
                            <button
                              disabled={updatingOrderId === order._id}
                              onClick={() => handleUpdateOrderStatus(order._id, 'accept')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Accept Order
                            </button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              disabled={updatingOrderId === order._id}
                              onClick={() => handleUpdateOrderStatus(order._id, 'process')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Start Processing
                            </button>
                          )}
                          {order.status === 'PROCESSING' && (
                            <button
                              disabled={updatingOrderId === order._id}
                              onClick={() => handleUpdateOrderStatus(order._id, 'pack')}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Pack Order
                            </button>
                          )}
                          {order.status === 'PACKED' && (
                            <button
                              disabled={updatingOrderId === order._id}
                              onClick={() => handleUpdateOrderStatus(order._id, 'ready-to-ship')}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              Mark Ready to Ship
                            </button>
                          )}

                          <Link
                            to={`/vendor/orders/${order._id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all border border-slate-200"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-lg text-slate-900">Add Marketplace Product</h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Herbal Tea"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Retail Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 499"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
                  <textarea
                    placeholder="Describe your product highlights and specifications..."
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors h-24"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Publish Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-lg text-slate-900">Request Payout Withdrawal</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
                <span>Available Balance:</span>
                <span className="font-black text-sm text-emerald-700">₹{(stats?.totalEarnings || 0).toLocaleString()}</span>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Withdrawal Amount (₹)</label>
                  <input
                    type="number"
                    max={stats?.totalEarnings || 0}
                    min={100}
                    required
                    placeholder="Enter amount (min ₹100)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vendor Platform Activation Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">Platform Activation Payment</h3>
                    <p className="text-xs text-slate-500">Super Admin Merchant Account Verification</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Merchant Registration Fee</span>
                  <span className="text-xl font-black text-blue-700">₹1,999</span>
                </div>
                <div className="text-[11px] text-slate-500 divide-y divide-blue-100/80 space-y-1.5 pt-2">
                  <div className="flex justify-between pt-1.5">
                    <span>Target Account:</span>
                    <strong className="text-slate-700">FairKart Super Admin</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Benefits:</span>
                    <strong className="text-emerald-700">Instant Store Activation & Unlimited Product Publishing</strong>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Payout Schedule:</span>
                    <strong className="text-slate-700">Automated 7-Day Vendor Settlement</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Once Paid:</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  All options (Add Products, Edit Catalog, Process Customer Orders, Request Withdrawals) will be instantly enabled and authorized on your merchant portal.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handlePayActivation}
                  className="w-2/3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹1,999 Now (Razorpay / Instant)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorDashboard;
