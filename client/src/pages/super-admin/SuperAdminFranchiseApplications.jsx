import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Building2,
  Calendar,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Send,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import franchiseVendorService from '../../services/franchiseVendorService';

export const SuperAdminFranchiseApplications = () => {
  const navigate = useNavigate();

  // Summary counts state
  const [stats, setStats] = useState({
    totalAppointed: 0,
    notYetSubmitted: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    moreInfoRequired: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Table state
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [kycStatusFilter, setKycStatusFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await franchiseVendorService.getFranchiseApplicationsStats();
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load application stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await franchiseVendorService.getFranchiseApplications({
        search,
        status: statusFilter,
        kycStatus: kycStatusFilter,
        state: stateFilter,
        district: districtFilter,
        page,
        limit: 10,
      });
      if (data) {
        setApplications(data.applications || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
      showToast('Error loading applications list', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, kycStatusFilter, stateFilter, districtFilter, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleRefresh = () => {
    loadStats();
    loadApplications();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3" /> Submitted
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'MORE_INFO_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertTriangle className="w-3 h-3" /> More Info Req.
          </span>
        );
      case 'PENDING_APPLICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" /> Pending Application
          </span>
        );
    }
  };

  const getKycBadge = (kycStatus) => {
    switch (kycStatus) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case 'SUBMITTED':
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Pending Review
          </span>
        );
    }
  };

  const getAccountBadge = (accStatus) => {
    switch (accStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
            Active
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700">
            Suspended
          </span>
        );
      case 'PENDING_APPROVAL':
      case 'UNDER_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Super Admin Portal • Referral & Onboarding
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Franchise Vendor Applications & KYC
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Review and process vendor onboarding applications and submitted KYC documents initiated via the Super Admin appointment and WhatsApp referral flow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-2 backdrop-blur-sm border border-white/10"
            title="Refresh list and stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/super-admin/franchise-vendors')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Building2 className="w-3.5 h-3.5" />
            Appoint New Vendor
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Appointed</p>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {statsLoading ? '...' : stats.totalAppointed}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">All referrals</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Not Yet Submitted</p>
          <p className="text-2xl font-black text-slate-600 mt-1">
            {statsLoading ? '...' : stats.notYetSubmitted}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Awaiting vendor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Submitted</p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {statsLoading ? '...' : stats.submitted}
          </p>
          <span className="text-[11px] text-blue-500 font-medium">Ready for review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Under Review</p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {statsLoading ? '...' : stats.underReview}
          </p>
          <span className="text-[11px] text-amber-500 font-medium">In evaluation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {statsLoading ? '...' : stats.approved}
          </p>
          <span className="text-[11px] text-emerald-500 font-medium">Verified & active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-black text-rose-700 mt-1">
            {statsLoading ? '...' : stats.rejected}
          </p>
          <span className="text-[11px] text-rose-500 font-medium">Declined</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">More Info Req.</p>
          <p className="text-2xl font-black text-purple-700 mt-1">
            {statsLoading ? '...' : stats.moreInfoRequired}
          </p>
          <span className="text-[11px] text-purple-500 font-medium">Clarification</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search vendor name, username, store, phone, code..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="MORE_INFO_REQUIRED">More Info Required</option>
            <option value="PENDING_APPLICATION">Pending Application</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={kycStatusFilter}
            onChange={(e) => {
              setKycStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All KYC Statuses</option>
            <option value="PENDING">KYC Pending</option>
            <option value="VERIFIED">KYC Verified</option>
            <option value="REJECTED">KYC Rejected</option>
          </select>
        </div>

        <input
          type="text"
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter State..."
          className="w-32 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter District..."
          className="w-32 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />

        {(search || statusFilter !== 'ALL' || kycStatusFilter !== 'ALL' || stateFilter || districtFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setKycStatusFilter('ALL');
              setStateFilter('');
              setDistrictFilter('');
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Vendor & Code</th>
                <th className="py-3 px-4">Business / Store</th>
                <th className="py-3 px-4">Phone / WhatsApp</th>
                <th className="py-3 px-4">Territory (State/Dist/Taluk)</th>
                <th className="py-3 px-4">Appointed At</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Application Status</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading franchise vendor applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <FileCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">No applications found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No appointed vendors match your current search and filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/75 transition">
                    {/* Vendor Name & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs">
                          {app.user?.name ? app.user.name.charAt(0).toUpperCase() : 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{app.user?.name || app.storeName || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {app.user?.username || app.franchiseCode || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Business Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {app.storeName || app.business?.storeName || '—'}
                    </td>

                    {/* Phone / WhatsApp */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-700">{app.user?.phone || '—'}</p>
                      {app.business?.whatsappNumber && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                          WA: {app.business.whatsappNumber}
                        </p>
                      )}
                    </td>

                    {/* Territory */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">
                        {app.stateName || '—'}
                        {app.districtName ? ` • ${app.districtName}` : ''}
                      </div>
                      {app.talukName && (
                        <div className="text-[11px] text-slate-400">{app.talukName}</div>
                      )}
                    </td>

                    {/* Appointed At */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {app.appointedAt ? new Date(app.appointedAt).toLocaleDateString('en-IN') : '—'}
                    </td>

                    {/* Submitted At */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {app.applicationSubmittedAt ? (
                        <span className="text-slate-900 font-semibold">
                          {new Date(app.applicationSubmittedAt).toLocaleDateString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not submitted</span>
                      )}
                    </td>

                    {/* Application Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(app.applicationStatus)}</td>

                    {/* KYC Status */}
                    <td className="py-3.5 px-4">{getKycBadge(app.kycStatus)}</td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">{getAccountBadge(app.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/super-admin/franchise-applications/${app._id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">
              Showing page {page} of {pages} ({total} applications)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-semibold hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminFranchiseApplications;
