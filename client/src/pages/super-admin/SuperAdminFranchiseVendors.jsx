import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  ShoppingBag,
  IndianRupee,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Send,
  MoreVertical,
  Eye,
  Edit,
  Power,
  RotateCcw,
  XCircle,
  FileSpreadsheet,
  Activity,
  BarChart3,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  MessageCircle,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import franchiseVendorService from '../../services/franchiseVendorService';
import { generateWhatsAppInvitation, openWhatsApp } from '../../utils/whatsappHelper';

export const SuperAdminFranchiseVendors = () => {
  const navigate = useNavigate();

  // Active View Tab: 'directory' | 'activities' | 'reports'
  const [activeTab, setActiveTab] = useState('directory');

  // Stats state
  const [stats, setStats] = useState({
    totalAppointed: 0,
    activeVendors: 0,
    pendingInvitations: 0,
    activatedVendors: 0,
    suspendedVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalPaidSales: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Directory state
  const [vendors, setVendors] = useState([]);
  const [totalVendors, setTotalVendors] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedInvitationStatus, setSelectedInvitationStatus] = useState('ALL');

  // Activity Log state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState('ALL');

  // Reports state
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Modals state
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [createdVendorResult, setCreatedVendorResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Clipboard copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // Status message
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await franchiseVendorService.getDashboardStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Vendors
  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await franchiseVendorService.getFranchiseVendors({
        search,
        state: selectedState,
        district: selectedDistrict,
        accountStatus: selectedStatus,
        invitationStatus: selectedInvitationStatus,
        page,
        limit: 10,
      });
      if (data) {
        setVendors(data.vendors || []);
        setTotalVendors(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
      showToast('Error loading franchise vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedState, selectedDistrict, selectedStatus, selectedInvitationStatus, page]);

  // Fetch Activities
  const loadActivities = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      const data = await franchiseVendorService.getAllVendorActivities({
        eventType: activityFilter,
        limit: 30,
      });
      if (data) setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [activityFilter]);

  // Fetch Reports
  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const data = await franchiseVendorService.getFranchiseReports();
      if (data) setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'directory') {
      loadVendors();
    } else if (activeTab === 'activities') {
      loadActivities();
    } else if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, loadVendors, loadActivities, loadReports]);

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      const blob = await franchiseVendorService.exportCsv();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `franchise_vendors_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('CSV Export downloaded successfully');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  };

  // Reissue Invitation
  const handleReissue = async (vendorId) => {
    if (!window.confirm('Reissue a new invitation link? The previous link will become invalid.')) return;
    try {
      const res = await franchiseVendorService.reissueInvitation(vendorId);
      setCreatedVendorResult({
        vendor: res.vendor,
        invitationToken: res.invitationToken,
      });
      setShowWhatsAppModal(true);
      loadVendors();
      loadStats();
      showToast('New invitation link generated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reissue invitation', 'error');
    }
  };

  // Revoke Invitation
  const handleRevoke = async (vendorId) => {
    if (!window.confirm('Are you sure you want to revoke this pending invitation?')) return;
    try {
      await franchiseVendorService.revokeInvitation(vendorId);
      loadVendors();
      loadStats();
      showToast('Invitation revoked');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke invitation', 'error');
    }
  };

  // Suspend / Reactivate Vendor
  const handleToggleStatus = async (vendorId, currentStatus) => {
    const isSuspended = currentStatus === 'SUSPENDED';
    const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
    const confirmMsg = isSuspended
      ? 'Reactivate this franchise vendor account?'
      : 'Suspend this franchise vendor? The vendor will lose dashboard and operational access.';
    if (!window.confirm(confirmMsg)) return;

    try {
      await franchiseVendorService.updateVendorStatus(vendorId, newStatus);
      loadVendors();
      loadStats();
      showToast(isSuspended ? 'Vendor reactivated successfully' : 'Vendor suspended successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Building2 className="w-4 h-4" />
              Super Admin Executive Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Franchise Vendor Management
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Exclusively appoint, manage, and monitor dedicated Franchise Vendors across states, districts, and taluks with direct WhatsApp invitation workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/super-admin/franchise-applications')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 text-sm"
            >
              <FileCheck className="w-4 h-4" />
              View Applications & KYC
            </button>
            <button
              onClick={() => setShowAppointModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Appoint New Franchise Vendor
            </button>
            <button
              onClick={handleExportCsv}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl transition border border-white/10 flex items-center gap-2 text-sm backdrop-blur-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Directory
            </button>
          </div>
        </div>
      </div>

      {/* Real Summary Cards (Real Database Calculation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Appointed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointed Vendors</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {statsLoading ? '...' : stats.totalAppointed}
            </h3>
            <span className="text-[11px] text-slate-400">Total Super Admin Created</span>
          </div>
        </div>

        {/* Card 2: Active Vendors */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Vendors</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">
              {statsLoading ? '...' : stats.activeVendors}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">Activated & Operating</span>
          </div>
        </div>

        {/* Card 3: Pending Invitations */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invites</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">
              {statsLoading ? '...' : stats.pendingInvitations}
            </h3>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting Password Setup</span>
          </div>
        </div>

        {/* Card 4: Suspended Vendors */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspended</p>
            <h3 className="text-2xl font-black text-rose-600 mt-0.5">
              {statsLoading ? '...' : stats.suspendedVendors}
            </h3>
            <span className="text-[11px] text-slate-400">Blocked / Inactive</span>
          </div>
        </div>

        {/* Card 5: Total Products */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Products Listed</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {statsLoading ? '...' : stats.totalProducts}
            </h3>
            <span className="text-[11px] text-slate-400">By Franchise Stores</span>
          </div>
        </div>

        {/* Card 6: Total Orders */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Franchise Orders</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {statsLoading ? '...' : stats.totalOrders}
            </h3>
            <span className="text-[11px] text-slate-400">Total Customer Sub-orders</span>
          </div>
        </div>

        {/* Card 7: Total Paid Sales */}
        <div className="col-span-2 bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Total Paid Sales</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                ₹{statsLoading ? '...' : Number(stats.totalPaidSales).toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-400">Excludes cancelled & refunded orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'directory'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Franchise Directory ({totalVendors})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'activities'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            Vendor Activities
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'reports'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Sales Reports & Analytics
          </button>
        </div>

        <button
          onClick={() => {
            loadStats();
            if (activeTab === 'directory') loadVendors();
            if (activeTab === 'activities') loadActivities();
            if (activeTab === 'reports') loadReports();
          }}
          className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: FRANCHISE VENDOR DIRECTORY                              */}
      {/* ============================================================== */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search store, username, phone, franchise code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Account Status</option>
                <option value="ACTIVE">Active (Operating)</option>
                <option value="PENDING_ACTIVATION">Pending Activation</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={selectedInvitationStatus}
                onChange={(e) => {
                  setSelectedInvitationStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Invitation Status</option>
                <option value="PENDING">Pending Setup</option>
                <option value="SENT">Sent via WhatsApp</option>
                <option value="ACCEPTED">Activated</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Franchise Store</th>
                  <th className="py-3 px-4">Username / Code</th>
                  <th className="py-3 px-4">Contact & WhatsApp</th>
                  <th className="py-3 px-4">Territory</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Invitation</th>
                  <th className="py-3 px-4 text-center">Products</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Paid Sales</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Loading franchise vendors...
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-700">No Franchise Vendors Found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click "Appoint New Franchise Vendor" to create your first dedicated franchise store.
                      </p>
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => {
                    const isActivated = v.activationStatus === 'ACTIVE';
                    const isSuspended = v.status === 'SUSPENDED' || v.activationStatus === 'SUSPENDED';

                    return (
                      <tr key={v._id} className="hover:bg-slate-50/80 transition">
                        {/* Store Info */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{v.storeName}</div>
                          <div className="text-[11px] text-slate-500">
                            Appointed {v.appointedAt ? new Date(v.appointedAt).toLocaleDateString('en-IN') : 'N/A'}
                          </div>
                        </td>

                        {/* Username & Code */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[11px]">
                            @{v.username || v.userId?.username}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {v.franchiseCode || 'NO-CODE'}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {v.phone}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
                            <MessageCircle className="w-3 h-3 text-emerald-500" />
                            {v.whatsappNumber || v.phone}
                          </div>
                        </td>

                        {/* Territory */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {v.territory?.taluk || '—'}, {v.territory?.district || '—'}
                          </div>
                          <div className="text-[11px] text-slate-500">{v.territory?.state || '—'}</div>
                        </td>

                        {/* Account Status */}
                        <td className="py-3 px-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3" /> SUSPENDED
                            </span>
                          ) : isActivated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> PENDING ACTIVATION
                            </span>
                          )}
                        </td>

                        {/* Invitation Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              v.invitationStatus === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : v.invitationStatus === 'SENT'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : v.invitationStatus === 'REVOKED'
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {v.invitationStatus || 'PENDING'}
                          </span>
                        </td>

                        {/* Products */}
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {v.productsCount || 0}
                        </td>

                        {/* Orders */}
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {v.ordersCount || 0}
                        </td>

                        {/* Paid Sales */}
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ₹{Number(v.paidSales || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/super-admin/franchise-vendors/${v._id}`)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="View Full Profile & Tabs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingVendor(v);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Permitted Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Reissue Invitation if not active */}
                            {!isActivated && (
                              <button
                                onClick={() => handleReissue(v._id)}
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Reissue & Open WhatsApp"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Suspend / Reactivate */}
                            <button
                              onClick={() => handleToggleStatus(v._id, v.status)}
                              className={`p-1.5 rounded-lg transition ${
                                isSuspended
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isSuspended ? 'Reactivate Vendor' : 'Suspend Vendor'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page {page} of {pages} ({totalVendors} total vendors)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 font-semibold hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 font-semibold hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: VENDOR ACTIVITIES TIMELINE                              */}
      {/* ============================================================== */}
      {activeTab === 'activities' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-900">Franchise Vendor Activity Stream</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time immutable audit records tracking all vendor appointments, activations, WhatsApp workflows, product changes, and status transitions.
              </p>
            </div>

            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="FRANCHISE_VENDOR_CREATED">Vendor Created</option>
              <option value="INVITATION_GENERATED">Invitation Generated</option>
              <option value="WHATSAPP_LINK_OPENED">WhatsApp Opened</option>
              <option value="INVITATION_MARKED_SENT">Invitation Sent</option>
              <option value="ACCOUNT_ACTIVATED">Account Activated</option>
              <option value="PRODUCT_CREATED">Product Added</option>
              <option value="ORDER_STATUS_CHANGED">Order Transition</option>
              <option value="ACCOUNT_SUSPENDED">Account Suspended</option>
            </select>
          </div>

          {activitiesLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading activity records...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No activity events recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <div
                  key={act._id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{act.description}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(act.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span>
                        Actor: <strong className="text-slate-700">{act.actorName}</strong> ({act.actorRole})
                      </span>
                      {act.vendorId?.storeName && (
                        <span>
                          Store: <strong className="text-slate-700">{act.vendorId.storeName}</strong>
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono">
                        {act.eventType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SALES REPORTS & ANALYTICS                               */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-lg font-black text-slate-900 mb-1">Franchise Territory & Performance Insights</h2>
            <p className="text-xs text-slate-500 mb-6">
              Real geographic distribution and performance metrics compiled directly from active orders and inventory.
            </p>

            {reportsLoading ? (
              <div className="text-center py-12 text-slate-400">Loading reports...</div>
            ) : reports ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Geographic distribution */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Top Appointed Districts
                  </h3>
                  <div className="space-y-2">
                    {reports.geoDistribution?.map((geo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-0"
                      >
                        <span className="font-semibold text-slate-700">
                          {geo._id?.district || 'General'}, {geo._id?.state || 'State'}
                        </span>
                        <span className="font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {geo.count} Vendors
                        </span>
                      </div>
                    ))}
                    {(!reports.geoDistribution || reports.geoDistribution.length === 0) && (
                      <p className="text-xs text-slate-400">No geographic distribution recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Account Status Breakdown */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Account Lifecycle Breakdown
                  </h3>
                  <div className="space-y-2">
                    {reports.statusDistribution?.map((stat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-0"
                      >
                        <span className="font-semibold text-slate-700">{stat._id}</span>
                        <span className="font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {stat.count} Accounts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">No report data found.</div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: APPOINT NEW FRANCHISE VENDOR                            */}
      {/* ============================================================== */}
      {showAppointModal && (
        <AppointFranchiseVendorModal
          onClose={() => setShowAppointModal(false)}
          onSuccess={(result) => {
            setShowAppointModal(false);
            setCreatedVendorResult(result);
            setShowWhatsAppModal(true);
            loadVendors();
            loadStats();
            showToast('Franchise Vendor appointed successfully!');
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: WHATSAPP SHARE & INVITATION LINK                        */}
      {/* ============================================================== */}
      {showWhatsAppModal && createdVendorResult && (
        <WhatsAppShareModal
          vendorData={createdVendorResult}
          onClose={() => setShowWhatsAppModal(false)}
          onView={() => {
            setShowWhatsAppModal(false);
            navigate(`/super-admin/franchise-vendors/${createdVendorResult.vendor._id}`);
          }}
          onMarkSent={async () => {
            try {
              await franchiseVendorService.markInvitationSent(createdVendorResult.vendor._id);
              showToast('Invitation recorded as sent in audit log');
              loadVendors();
            } catch (e) {
              showToast('Error recording status', 'error');
            }
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT PERMITTED VENDOR DETAILS                           */}
      {/* ============================================================== */}
      {showEditModal && editingVendor && (
        <EditFranchiseVendorModal
          vendor={editingVendor}
          onClose={() => {
            setShowEditModal(false);
            setEditingVendor(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingVendor(null);
            loadVendors();
            showToast('Vendor updated successfully');
          }}
        />
      )}
    </div>
  );
};

// ====================================================================
// SUBCOMPONENT: APPOINT FRANCHISE VENDOR MODAL
// ====================================================================
function AppointFranchiseVendorModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    whatsappNumber: '',
    sameAsPhone: true,
    email: '',
    storeName: '',
    state: 'Karnataka',
    district: '',
    taluk: '',
    fullAddress: '',
    franchiseCode: '',
    appointmentNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateUsername = () => {
    const base = formData.storeName || formData.name || 'franchise';
    const clean = base
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 10);
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, username: `${clean}_${rand}` }));
  };

  const generateFranchiseCode = () => {
    const prefix = 'FR';
    const cleanStore = (formData.storeName || 'STR')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, franchiseCode: `${prefix}-${cleanStore}-${rand}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.username || !formData.phone || !formData.storeName || !formData.state || !formData.district || !formData.taluk) {
      setError('Please fill in all required fields (Name, Username, Phone, Store, State, District, Taluk).');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        whatsappNumber: formData.sameAsPhone ? formData.phone : formData.whatsappNumber,
      };
      const result = await franchiseVendorService.createFranchiseVendor(payload);
      onSuccess(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to appoint franchise vendor. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Appoint New Franchise Vendor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin exclusive appointment. An expiring, single-use invitation link will be created for WhatsApp delivery.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Franchise Store Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Baapoo Mart Hassan Central"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Username with Auto-Generate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Assigned Username <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateUsername}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-generate
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. ramesh_hassan"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Email Address (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="e.g. ramesh@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210 (10 digits)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <label className="text-[11px] text-slate-600 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sameAsPhone}
                    onChange={(e) => setFormData({ ...formData, sameAsPhone: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Same as Phone
                </label>
              </div>
              <input
                type="tel"
                required={!formData.sameAsPhone}
                disabled={formData.sameAsPhone}
                placeholder="e.g. 9876543210"
                value={formData.sameAsPhone ? formData.phone : formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hassan"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Taluk */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taluk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Channarayapatna"
                value={formData.taluk}
                onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Franchise Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Franchise Code (Optional)</label>
                <button
                  type="button"
                  onClick={generateFranchiseCode}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-generate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. FR-HASSAN-101"
                value={formData.franchiseCode}
                onChange={(e) => setFormData({ ...formData, franchiseCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Store Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Main Road, Near Bus Stand, Hassan, 573201"
              value={formData.fullAddress}
              onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Appointment Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Notes (Internal)</label>
            <textarea
              rows={2}
              placeholder="Notes on agreement terms, special concessions, or territory assignment..."
              value={formData.appointmentNotes}
              onChange={(e) => setFormData({ ...formData, appointmentNotes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Create Franchise Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====================================================================
// SUBCOMPONENT: WHATSAPP SHARE MODAL (Enforces exact WhatsApp rule)
// ====================================================================
function WhatsAppShareModal({ vendorData, onClose, onView, onMarkSent }) {
  const [copied, setCopied] = useState(false);
  const [sentMarked, setSentMarked] = useState(false);

  const { vendor, invitationToken } = vendorData;
  const whatsappInfo = generateWhatsAppInvitation({
    whatsappNumber: vendor.whatsappNumber || vendor.phone,
    token: invitationToken,
  });

  const handleOpenWhatsApp = async () => {
    try {
      await franchiseVendorService.recordWhatsAppOpened(vendor._id);
    } catch (e) {
      // Non-blocking
    }
    openWhatsApp(whatsappInfo.clickToChatUrl);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(whatsappInfo.invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMarkSentClick = async () => {
    await onMarkSent();
    setSentMarked(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <CheckCircle className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-slate-900 text-center">
          Franchise Vendor Created Successfully!
        </h2>
        <p className="text-xs text-slate-500 text-center mt-1">
          The account is in <strong className="text-amber-600">Pending Activation</strong> status. Share the secure invitation link with the vendor so they can set their permanent password.
        </p>

        {/* Vendor Summary Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Store Name:</span>
            <span className="font-bold text-slate-900">{vendor.storeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Username:</span>
            <span className="font-mono font-bold text-indigo-700">@{vendor.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">WhatsApp Number:</span>
            <span className="font-bold text-slate-900">+{whatsappInfo.formattedNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Franchise Code:</span>
            <span className="font-mono font-semibold text-slate-800">{vendor.franchiseCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Link Expiry:</span>
            <span className="font-bold text-amber-600">24 Hours (Single-use)</span>
          </div>
        </div>

        {/* Link Box */}
        <div className="mt-4 p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-slate-700 truncate select-all">
            {whatsappInfo.invitationLink}
          </span>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 bg-white text-slate-700 rounded-lg text-xs font-bold border border-slate-300 hover:bg-slate-50 shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* WhatsApp Notice */}
        <p className="text-[11px] text-slate-400 text-center mt-3">
          Note: Clicking the button below opens WhatsApp addressed to the vendor with ONLY the invitation link prefilled. No automatic background message is sent.
        </p>

        {/* Actions Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Primary Action: Open WhatsApp */}
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle className="w-5 h-5" />
            Open WhatsApp & Send Invitation
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              Copy Invitation Link
            </button>

            <button
              onClick={handleMarkSentClick}
              disabled={sentMarked}
              className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              {sentMarked ? 'Marked as Sent' : 'Mark as Sent'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onView}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View Full Vendor Details →
            </button>
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// SUBCOMPONENT: EDIT FRANCHISE VENDOR MODAL
// ====================================================================
function EditFranchiseVendorModal({ vendor, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    storeName: vendor.storeName || '',
    phone: vendor.phone || '',
    whatsappNumber: vendor.whatsappNumber || '',
    state: vendor.territory?.state || '',
    district: vendor.territory?.district || '',
    taluk: vendor.territory?.taluk || '',
    fullAddress: vendor.territory?.fullAddress || '',
    appointmentNotes: vendor.appointmentNotes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await franchiseVendorService.updateFranchiseVendor(vendor._id, {
        storeName: formData.storeName,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        appointmentNotes: formData.appointmentNotes,
        territory: {
          state: formData.state,
          district: formData.district,
          taluk: formData.taluk,
          fullAddress: formData.fullAddress,
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">Edit Franchise Store Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && <div className="mt-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700">Store Name</label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">WhatsApp</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Taluk</label>
              <input
                type="text"
                value={formData.taluk}
                onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700">Notes</label>
            <textarea
              rows={2}
              value={formData.appointmentNotes}
              onChange={(e) => setFormData({ ...formData, appointmentNotes: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-slate-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-900 text-white font-bold rounded-xl"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuperAdminFranchiseVendors;
