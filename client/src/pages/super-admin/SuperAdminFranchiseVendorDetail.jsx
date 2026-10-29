import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  ShoppingBag,
  IndianRupee,
  RotateCcw,
  Copy,
  Check,
  Power,
  Shield,
  Activity,
  CreditCard,
  BarChart3,
  Edit,
  ExternalLink,
} from 'lucide-react';
import franchiseVendorService from '../../services/franchiseVendorService';
import { generateWhatsAppInvitation, openWhatsApp } from '../../utils/whatsappHelper';

export const SuperAdminFranchiseVendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Sub-resource states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [activities, setActivities] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // Invitation link copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [reissuedToken, setReissuedToken] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVendorData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await franchiseVendorService.getFranchiseVendorById(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load franchise vendor:', err);
      showToast('Error loading vendor details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  // Load sub-resources based on active tab
  useEffect(() => {
    if (!id) return;
    const loadTabContent = async () => {
      try {
        setSubLoading(true);
        if (activeTab === 'products') {
          const res = await franchiseVendorService.getVendorProducts(id);
          setProducts(res.products || []);
        } else if (activeTab === 'orders') {
          const res = await franchiseVendorService.getVendorOrders(id);
          setOrders(res.orders || []);
        } else if (activeTab === 'sales') {
          const res = await franchiseVendorService.getVendorDailySales(id);
          setDailySales(res || []);
        } else if (activeTab === 'activities' || activeTab === 'overview') {
          const res = await franchiseVendorService.getVendorActivities(id);
          setActivities(res.activities || []);
        }
      } catch (err) {
        console.error('Failed to load tab content:', err);
      } finally {
        setSubLoading(false);
      }
    };
    loadTabContent();
  }, [id, activeTab]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading Franchise Vendor details...
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="py-20 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Franchise Vendor Not Found</h2>
        <button
          onClick={() => navigate('/super-admin/franchise-vendors')}
          className="mt-4 px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const { vendor, business, location, kyc, bank, stats } = data;
  const isActivated = vendor.activationStatus === 'ACTIVE';
  const isSuspended = vendor.status === 'SUSPENDED' || vendor.activationStatus === 'SUSPENDED';

  // WhatsApp click-to-chat url if a reissued token is in memory
  const whatsappInfo = reissuedToken
    ? generateWhatsAppInvitation({
        whatsappNumber: vendor.whatsappNumber || vendor.phone,
        token: reissuedToken,
      })
    : null;

  // Handle Reissue Invitation
  const handleReissue = async () => {
    if (!window.confirm('Reissue a new invitation link? The previous token will become invalid.')) return;
    try {
      const res = await franchiseVendorService.reissueInvitation(id);
      setReissuedToken(res.invitationToken);
      loadVendorData();
      showToast('New invitation token generated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reissue invitation', 'error');
    }
  };

  // Handle Revoke Invitation
  const handleRevoke = async () => {
    if (!window.confirm('Revoke this pending invitation?')) return;
    try {
      await franchiseVendorService.revokeInvitation(id);
      loadVendorData();
      showToast('Invitation revoked');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke invitation', 'error');
    }
  };

  // Handle Suspend / Reactivate
  const handleToggleStatus = async () => {
    const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
    if (!window.confirm(isSuspended ? 'Reactivate this vendor?' : 'Suspend this vendor?')) return;
    try {
      await franchiseVendorService.updateVendorStatus(id, newStatus);
      loadVendorData();
      showToast(isSuspended ? 'Vendor reactivated' : 'Vendor suspended');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/super-admin/franchise-vendors')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Franchise Vendor Management
        </button>
      </div>

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
              {vendor.storeName?.charAt(0) || 'F'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900">{vendor.storeName}</h1>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  @{vendor.username || vendor.userId?.username}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {vendor.franchiseCode || 'CODE-PENDING'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {vendor.phone}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  WA: {vendor.whatsappNumber || vendor.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {vendor.territory?.taluk}, {vendor.territory?.district}, {vendor.territory?.state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Appointed {vendor.appointedAt ? new Date(vendor.appointedAt).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Status & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              {isSuspended ? (
                <span className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 text-xs font-extrabold rounded-full">
                  SUSPENDED
                </span>
              ) : isActivated ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-full">
                  ACTIVE & OPERATING
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold rounded-full">
                  PENDING ACTIVATION
                </span>
              )}
            </div>

            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isSuspended ? 'Reactivate Vendor' : 'Suspend Vendor'}
            </button>
          </div>
        </div>

        {/* 4 Summary Mini KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Products Listed</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.productsCount}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Orders Received</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.ordersCount}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Paid Sales</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              ₹{Number(stats.totalPaidSales).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Available Balance</span>
            <div className="text-xl font-black text-indigo-700 mt-0.5">
              ₹{Number(vendor.balance || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* 8 Detail Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: '1. Overview' },
          { id: 'profile', label: '2. Store Profile' },
          { id: 'products', label: '3. Products' },
          { id: 'orders', label: '4. Orders' },
          { id: 'sales', label: '5. Daily Sales Report' },
          { id: 'subscriptions', label: '6. Subscriptions & Payments' },
          { id: 'activities', label: '7. Activity Log' },
          { id: 'security', label: '8. Invitation & Security' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm border-b pb-2">Franchise Assignment Details</h3>
            <div className="text-xs space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Appointing Super Admin:</span>
                <span className="font-semibold">{vendor.appointedBy?.name || 'Super Admin'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Appointment Date:</span>
                <span className="font-semibold">
                  {vendor.appointedAt ? new Date(vendor.appointedAt).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Activation Timestamp:</span>
                <span className="font-semibold">
                  {vendor.activatedAt ? new Date(vendor.activatedAt).toLocaleString('en-IN') : 'Not yet activated'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Invitation Status:</span>
                <span className="font-semibold text-indigo-700">{vendor.invitationStatus || 'PENDING'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Platform Fee:</span>
                <span className="font-bold text-emerald-600">Waived (Super Admin Appointed)</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Appointment Notes:</span>
                <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {vendor.appointmentNotes || 'No notes specified.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm border-b pb-2">Recent Store Activities</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity recorded.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((act) => (
                  <div key={act._id} className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>{act.description}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      By {act.actorName} ({act.actorRole})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STORE PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <h3 className="font-black text-slate-900 text-sm border-b pb-2">Full Store Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block">Owner Name:</span>
              <strong className="text-slate-800">{vendor.userId?.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Assigned Username:</span>
              <strong className="text-indigo-700 font-mono">@{vendor.username || vendor.userId?.username}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Primary Phone:</span>
              <strong className="text-slate-800">{vendor.phone}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">WhatsApp Number:</span>
              <strong className="text-emerald-700">{vendor.whatsappNumber || vendor.phone}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Email Address:</span>
              <strong className="text-slate-800">{vendor.email || vendor.userId?.email}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Store Slug:</span>
              <strong className="text-slate-800 font-mono">{vendor.slug}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Territory:</span>
              <strong className="text-slate-800">
                {vendor.territory?.taluk}, {vendor.territory?.district}, {vendor.territory?.state}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Full Physical Address:</span>
              <strong className="text-slate-800">{vendor.territory?.fullAddress || 'N/A'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-black text-slate-900 text-sm mb-4">
            Products Listed by this Franchise Store ({products.length})
          </h3>
          {subLoading ? (
            <div className="py-12 text-center text-slate-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No products uploaded yet by this franchise vendor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-600">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Stock</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.categoryId?.name || 'General'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹{p.price}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.stock}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-black text-slate-900 text-sm mb-4">Orders for this Franchise Store ({orders.length})</h3>
          {subLoading ? (
            <div className="py-12 text-center text-slate-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No orders placed for this vendor yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-600">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Grand Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {o.subOrderNumber || o.publicSuborderId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{o.userId?.name || 'Customer'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{o.items?.length || 0}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹{o.grandTotal}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DAILY SALES REPORT */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-black text-slate-900 text-sm mb-4">Daily Sales Report (Last 30 Days)</h3>
          {dailySales.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No daily sales recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-600">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Orders</th>
                    <th className="py-2.5 px-3 text-right">Total Sales</th>
                    <th className="py-2.5 px-3 text-right">Vendor Net Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailySales.map((s) => (
                    <tr key={s.date} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{s.date}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{s.orderCount}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{s.totalSales}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700">₹{s.vendorEarnings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SUBSCRIPTIONS & FINANCE */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <h3 className="font-black text-slate-900 text-sm border-b pb-2">Vendor Financial & Payout Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block">Account Balance:</span>
              <strong className="text-xl font-black text-slate-900">₹{vendor.balance || 0}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Pending Balance:</span>
              <strong className="text-xl font-black text-amber-600">₹{vendor.pendingBalance || 0}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Platform Commission Rate:</span>
              <strong className="text-slate-800">{vendor.commissionRate || 10}%</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Platform Fee Status:</span>
              <strong className="text-emerald-700 font-bold">PAID (Admin Granted)</strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY LOG */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-black text-slate-900 text-sm mb-4">Complete Audit & Activity Timeline</h3>
          {activities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No activity records found.</div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{act.description}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(act.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex gap-2">
                    <span>By {act.actorName} ({act.actorRole})</span>
                    <span className="font-mono bg-slate-200 px-1 rounded text-[10px]">{act.eventType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: INVITATION & SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs">
          <h3 className="font-black text-slate-900 text-sm border-b pb-2">Invitation & Authentication Status</h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Account Activation:</span>
              <span className="font-bold">
                {isActivated ? (
                  <span className="text-emerald-700">ACTIVATED</span>
                ) : (
                  <span className="text-amber-600">PENDING ACTIVATION</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invitation State:</span>
              <span className="font-bold text-indigo-700">{vendor.invitationStatus || 'PENDING'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Activated At:</span>
              <span>{vendor.activatedAt ? new Date(vendor.activatedAt).toLocaleString('en-IN') : 'N/A'}</span>
            </div>
          </div>

          {!isActivated && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReissue}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Generate New Invitation Link
                </button>
                <button
                  onClick={handleRevoke}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Revoke Pending Invitation
                </button>
              </div>

              {whatsappInfo && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="font-bold text-emerald-900">New Invitation Link Ready:</div>
                  <div className="p-2 bg-white rounded border font-mono text-[11px] truncate select-all">
                    {whatsappInfo.invitationLink}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openWhatsApp(whatsappInfo.clickToChatUrl)}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open WhatsApp & Send Invitation
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(whatsappInfo.invitationLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-4 py-2 bg-white border font-bold rounded-xl"
                    >
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminFranchiseVendorDetail;
