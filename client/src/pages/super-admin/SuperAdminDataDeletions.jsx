import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserX,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Lock,
  Archive,
  X,
} from 'lucide-react';
import api from '../../services/api';

export const SuperAdminDataDeletions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: '', request: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/super-admin/data-deletion-requests', { params });
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load data deletion requests:', err);
      setFeedback({ type: 'error', message: 'Failed to fetch data deletion requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleAction = async () => {
    if (!actionModal.request) return;
    setProcessing(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.post(`/super-admin/data-deletion-requests/${actionModal.request._id}/process`, {
        action: actionModal.type,
        adminNotes,
      });

      if (res.data?.success) {
        setFeedback({
          type: 'success',
          message: actionModal.type === 'COMPLETE'
            ? 'Account and personal data anonymization completed successfully. Financial ledgers preserved.'
            : `Request marked as ${actionModal.type}`,
        });
        setActionModal({ open: false, type: '', request: null });
        setAdminNotes('');
        fetchRequests();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to process deletion action',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.referenceId?.toLowerCase().includes(q) ||
      r.requesterEmail?.toLowerCase().includes(q) ||
      r.userId?.name?.toLowerCase().includes(q) ||
      r.userRole?.toLowerCase().includes(q)
    );
  });

  const counts = {
    total: requests.length,
    submitted: requests.filter((r) => r.status === 'SUBMITTED').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    completed: requests.filter((r) => r.status === 'COMPLETED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black uppercase tracking-wider border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Right to be Forgotten &amp; Privacy Compliance</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account &amp; Data Deletion Requests</h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Super Admin verification desk for data deletion requests. Complies with the Digital Personal Data Protection Act, 2023. Personal identifiers, wishlists, and KYC files are purged upon completion while statutory financial transaction ledgers are strictly retained for 8 years per Indian GST and tax guidelines.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 self-start shrink-0 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{counts.submitted}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{counts.approved}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed (Anonymized)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{counts.completed}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rejected</span>
          <div className="text-2xl font-black text-slate-400 mt-1">{counts.rejected}</div>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Reference, Email, Role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Table of Requests */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Reference ID</th>
                <th className="px-6 py-4">Requester</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading deletion requests...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No data deletion requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{req.referenceId}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{req.userId?.name || req.requesterEmail}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.requesterEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                        {req.userRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(req.submittedAt || req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        {req.status === 'SUBMITTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionModal({ open: true, type: 'APPROVE', request: req })}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionModal({ open: true, type: 'REJECT', request: req })}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {(req.status === 'SUBMITTED' || req.status === 'APPROVED') && (
                          <button
                            type="button"
                            onClick={() => setActionModal({ open: true, type: 'COMPLETE', request: req })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                          >
                            Anonymize
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="font-bold text-sm text-slate-900">Request Details ({selectedRequest.referenceId})</div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div><strong>Requester Email:</strong> {selectedRequest.requesterEmail}</div>
              <div><strong>Account Role:</strong> {selectedRequest.userRole}</div>
              <div><strong>Reason Provided:</strong> {selectedRequest.reason || 'None provided'}</div>
              <div><strong>Status:</strong> {selectedRequest.status}</div>
              <div><strong>Statutory Retention Policy:</strong> {selectedRequest.retentionExplanation}</div>
              {selectedRequest.adminNotes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong>Admin Notes:</strong> {selectedRequest.adminNotes}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Confirm Action: {actionModal.type}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {actionModal.type === 'COMPLETE'
                ? 'This will irrevocably anonymize the user name, email, phone, and purge wishlists/addresses. Orders and financial ledgers will be preserved under statutory retention.'
                : `Are you sure you want to mark this request as ${actionModal.type}?`}
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Internal Audit Note</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter justification or audit rationale..."
                rows="3"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={processing}
                onClick={() => setActionModal({ open: false, type: '', request: null })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleAction}
                className="px-4 py-2 rounded-xl bg-[#30358F] hover:bg-[#252A68] text-white font-bold text-xs"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDataDeletions;
