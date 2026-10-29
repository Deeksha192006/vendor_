import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Store, MapPin, FileText, CheckCircle, Clock, AlertCircle, RefreshCcw, Landmark, ShieldCheck, ShieldAlert, UserX, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const VendorProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  // Edit modes
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Data Deletion States
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [confirmUnderstood, setConfirmUnderstood] = useState(false);
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [deletionFeedback, setDeletionFeedback] = useState({ type: '', text: '' });

  const fetchDeletionStatus = async () => {
    try {
      const res = await api.get('/users/me/data-deletion-request');
      if (res.data?.success) {
        setDeletionRequest(res.data.data);
      }
    } catch (err) {
      // Ignore if none
    }
  };

  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    if (!confirmUnderstood) return;

    setSubmittingDeletion(true);
    setDeletionFeedback({ type: '', text: '' });

    try {
      const res = await api.post('/users/me/data-deletion-request', {
        reason: deletionReason.trim() || undefined,
      });

      if (res.data?.success) {
        setDeletionFeedback({
          type: 'success',
          text: `Request submitted successfully. Reference ID: ${res.data.data.referenceId}`,
        });
        setShowDeletionModal(false);
        fetchDeletionStatus();
      }
    } catch (err) {
      setDeletionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit deletion request',
      });
    } finally {
      setSubmittingDeletion(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchHistory();
    fetchDeletionStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/vendor/me');
      setProfile(res.data.data);
      setFormData({
        storeName: res.data.data.vendor.storeName || '',
        description: res.data.data.vendor.description || '',
        businessType: res.data.data.business?.businessType || '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/vendor/status-history');
      setHistory(res.data.data.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBasicInfo = async (e) => {
    e.preventDefault();
    try {
      await api.put('/vendor/me', {
        storeName: formData.storeName,
        description: formData.description,
        business: { businessType: formData.businessType },
      });
      alert('Profile updated successfully!');
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-medium">Loading merchant profile...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-16 text-center text-slate-500 font-medium">Profile not found.</div>;
  }

  const { vendor, business, location, kyc, bank } = profile;

  const renderStatus = (status) => {
    if (status === 'APPROVED' || status === 'VERIFIED') {
      return (
        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> {status}
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {status}
        </span>
      );
    }
    return (
      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
        <Clock className="w-3 h-3" /> {status || 'PENDING'}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Store className="w-5 h-5" />
            </div>
            <span>My Vendor Profile</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">Manage store profile information and track KYC compliance status.</p>
        </div>
        <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80 text-right">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Profile Status</div>
          <div className="text-sm font-black mt-0.5">{renderStatus(vendor.status)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Basic Information</span>
            </h2>

            {!editMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Store Name</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{vendor.storeName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Business Type</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{business?.businessType || 'General Merchant'}</p>
                </div>
                <div className="col-span-2 pt-2">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Description</p>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {vendor.description || 'No description provided.'}
                  </p>
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="col-span-2 py-3 mt-3 bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-bold rounded-xl transition-all border border-blue-200"
                >
                  Edit Store Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateBasicInfo} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-600 font-bold">Store Name</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-bold">Business Type</label>
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-bold">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium h-24 resize-none mt-1"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Location & Contact */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Location & Contact</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Address</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{location?.fullAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Territory</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {location?.talukArea?.name || ''}, {location?.district?.name || ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pincode</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{location?.pincode || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
              Note: Address and territory adjustments require administrative re-verification. Contact merchant support if you relocate.
            </div>
          </div>
        </div>

        {/* Right Col: Verifications & History */}
        <div className="space-y-6">
          {/* Verification Status */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>KYC Verifications</span>
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-700 font-bold">Identity Doc</span>
                <span>{renderStatus(kyc?.identityDocumentStatus)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-700 font-bold">PAN Card</span>
                <span>{renderStatus(kyc?.panDocumentStatus)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-700 font-bold">GST Certificate</span>
                <span>{renderStatus(kyc?.gstCertificateStatus)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-700 font-bold">Business Proof</span>
                <span>{renderStatus(kyc?.businessProofStatus)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" /> Bank Account
                </span>
                <span>{renderStatus(bank?.verificationStatus)}</span>
              </div>
            </div>

            {vendor.status === 'REJECTED' && (
              <button
                onClick={() => (window.location.href = '/vendor/onboarding')}
                className="w-full mt-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex justify-center items-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Fix Rejections & Resubmit</span>
              </button>
            )}
          </div>

          {/* Status History */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Status History</span>
            </h2>
            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-2">
              {history.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">No audit logs recorded yet.</div>
              )}
              {history.map((h) => (
                <div key={h._id} className="border-l-2 border-blue-600 pl-3 py-0.5">
                  <div className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    <span className="text-slate-500">{h.previousStatus}</span> &rarr;{' '}
                    <span className="text-blue-600">{h.newStatus}</span>
                  </div>
                  {h.reason && <div className="text-xs text-rose-600 mt-0.5 italic">"{h.reason}"</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Data Rights (Account & Personal Data Deletion) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>Privacy &amp; Data Rights (Account &amp; Store Deletion)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Request closure of your merchant account and sanitization of personal identifiers.
                </p>
              </div>

              {deletionRequest && (
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider self-start sm:self-auto ${
                    deletionRequest.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : deletionRequest.status === 'APPROVED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : deletionRequest.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  Status: {deletionRequest.status}
                </span>
              )}
            </div>

            {deletionFeedback.text && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  deletionFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {deletionFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{deletionFeedback.text}</span>
              </div>
            )}

            {deletionRequest ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-slate-400 font-medium">Tracking Reference: </span>
                    <span className="font-mono font-bold text-slate-900">{deletionRequest.referenceId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Submitted: </span>
                    <span className="font-bold text-slate-800">
                      {new Date(deletionRequest.submittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <p><strong>Statutory Retention Note:</strong> {deletionRequest.retentionExplanation}</p>
                  {deletionRequest.adminNotes && (
                    <p className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <strong>Administrative Feedback:</strong> {deletionRequest.adminNotes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#30358F]" />
                    <span>Vendor Account Closure &amp; Data Minimization</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500">
                    <li><strong>Purged Personal Data:</strong> Personal login credentials, direct contact phone numbers, identity KYC files, and profile avatars are sanitized or purged.</li>
                    <li><strong>Legally Retained Records:</strong> Pursuant to Indian GST regulations and tax auditing obligations, past order fulfillment invoices, tax credit notes, and vendor payout ledgers are retained for up to 8 years.</li>
                    <li><strong>Store Access:</strong> Your storefront will be delisted and administrative vendor login access will cease upon request completion.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeletionModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Request Account and Data Deletion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Confirmation & Reason */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Confirm Merchant Account &amp; Data Deletion Request</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                You are requesting the closure of your vendor account and deletion/anonymization of associated personal information.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Statutory Retention Notice:</strong> Tax invoices, GST reports, commission records, and payout ledgers cannot be deleted due to mandatory 8-year statutory compliance requirements under Indian tax laws. Personal identity details and KYC files will be anonymized or purged.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Optional Reason for Closing Account</label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Tell us why you wish to close your merchant account (optional)..."
                rows="3"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmUnderstood}
                onChange={(e) => setConfirmUnderstood(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
              />
              <span>I understand that this action is irreversible and that my personal details will be sanitized while statutory tax and financial transaction records are legally retained.</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                disabled={submittingDeletion}
                onClick={() => setShowDeletionModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmUnderstood || submittingDeletion}
                onClick={handleRequestDeletion}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                {submittingDeletion && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Deletion Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VendorProfile;
