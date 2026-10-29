import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, Search, Filter, ShieldAlert, Store, AlertCircle, CheckCircle, Clock, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminVendorList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCounters();
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [search, statusFilter, kycStatusFilter, page]);

  const fetchCounters = async () => {
    try {
      const res = await api.get('/admin/vendors/dashboard-counters');
      setCounters(res.data.data.counters);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search,
        status: statusFilter,
        kycStatus: kycStatusFilter,
      });
      const res = await api.get(`/admin/vendors?${queryParams.toString()}`);
      setVendors(res.data.data.vendors || []);
      setTotalPages(res.data.data.pagination?.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Store className="w-5 h-5" />
            </div>
            <span>Vendor Applications</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Review and govern merchant onboarding requests, KYC documentation, and storefront profiles.
          </p>
        </div>

        <button
          onClick={() => navigate('/super-admin/users?role=VENDOR')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer"
        >
          <Eye className="w-4 h-4" /> Open 360 Vendor Directory
        </button>
      </div>

      {/* Counters */}
      {counters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {[
            { label: 'Total', value: counters.total, color: 'text-blue-600', icon: Store, bg: 'bg-blue-50/70 border-blue-100' },
            { label: 'Pending', value: counters.pending, color: 'text-slate-700', icon: Clock, bg: 'bg-slate-50 border-slate-200' },
            { label: 'Reviewing', value: counters.underReview, color: 'text-amber-600', icon: Search, bg: 'bg-amber-50/70 border-amber-100' },
            { label: 'Approved', value: counters.approved, color: 'text-emerald-600', icon: CheckCircle, bg: 'bg-emerald-50/70 border-emerald-100' },
            { label: 'Rejected', value: counters.rejected, color: 'text-rose-600', icon: AlertCircle, bg: 'bg-rose-50/70 border-rose-100' },
            { label: 'Suspended', value: counters.suspended, color: 'text-purple-600', icon: ShieldAlert, bg: 'bg-purple-50/70 border-purple-100' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white border p-4 rounded-2xl flex flex-col items-center justify-center shadow-xs ${stat.bg}`}
            >
              <stat.icon className={`w-5 h-5 mb-1.5 ${stat.color}`} />
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by store name, email or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-600 shadow-xs"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select
          value={kycStatusFilter}
          onChange={(e) => {
            setKycStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-600 shadow-xs"
        >
          <option value="">All KYC Statuses</option>
          <option value="PENDING">Pending KYC</option>
          <option value="PARTIALLY_VERIFIED">Partially Verified</option>
          <option value="VERIFIED">KYC Verified</option>
          <option value="REJECTED">KYC Rejected</option>
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white border border-slate-200/80 p-12 rounded-3xl text-center space-y-3 shadow-xs">
          <Store className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="text-base text-slate-600 font-bold">No vendors found matching your criteria.</div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4">Vendor Info</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">KYC Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-base">{v.storeName}</div>
                      <div className="text-slate-500 text-xs">{v.userId?.email || v.email}</div>
                      <div className="text-slate-400 font-mono text-xs mt-0.5">{v.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      {v.location ? (
                        <>
                          <div className="text-slate-800 font-medium">
                            {v.location.talukArea?.name || 'Assigned Area'}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {v.location.district?.name}, {v.location.state?.name}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No Location</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          v.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : v.status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : v.status === 'SUSPENDED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border w-fit ${
                            v.isPaid || v.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {v.isPaid || v.paymentStatus === 'PAID' ? 'PAID (₹1,999)' : 'UNPAID'}
                        </span>
                        {(!v.isPaid && v.paymentStatus !== 'PAID') && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Mark ${v.storeName} registration payment as PAID (₹1,999)? This will approve the vendor and enable all platform features.`)) {
                                try {
                                  await api.put(`/admin/vendors/${v._id}/payment-status`, { paymentStatus: 'PAID', paidAmount: 1999 });
                                  alert(`Payment verified! ${v.storeName} is now marked as PAID and APPROVED.`);
                                  fetchVendors();
                                } catch (err) {
                                  alert(err.response?.data?.message || 'Error updating payment status');
                                }
                              }
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline text-left cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          v.kycStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.kycStatus === 'PARTIALLY_VERIFIED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : v.kycStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {v.kycStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/super-admin/users?role=VENDOR')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> 360 Inspector
                        </button>
                        <button
                          onClick={() => navigate(`/super-admin/vendors/${v._id}/review`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs cursor-pointer"
                        >
                          Review Application
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-sm bg-slate-50/50">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
              >
                Previous
              </button>
              <span className="text-slate-600 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminVendorList;
