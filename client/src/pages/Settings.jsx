import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { Settings as SettingsIcon, Lock, KeyRound, CheckCircle, RefreshCw, Bell, UserX, ShieldAlert, AlertTriangle, FileText } from 'lucide-react';
import { fetchCurrentUser } from '../store/authSlice';
import { motion } from 'framer-motion';

export const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    orderUpdates: user?.notificationPreferences?.orderUpdates ?? true,
    walletAlerts: user?.notificationPreferences?.walletAlerts ?? true,
    securityAlerts: user?.notificationPreferences?.securityAlerts ?? true,
    promotional: user?.notificationPreferences?.promotional ?? false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [prefLoading, setPrefLoading] = useState(false);
  const [prefMessage, setPrefMessage] = useState(null);
  const [prefError, setPrefError] = useState(null);

  // Data Deletion States
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [loadingDeletion, setLoadingDeletion] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [confirmUnderstood, setConfirmUnderstood] = useState(false);
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [deletionFeedback, setDeletionFeedback] = useState({ type: '', text: '' });

  const fetchDeletionStatus = async () => {
    try {
      setLoadingDeletion(true);
      const res = await api.get('/users/me/data-deletion-request');
      if (res.data?.success) {
        setDeletionRequest(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load deletion request status:', err);
    } finally {
      setLoadingDeletion(false);
    }
  };

  useEffect(() => {
    fetchDeletionStatus();
  }, []);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePrefChange = (e) => {
    setPreferences({ ...preferences, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.put('/users/me/password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      if (res.data?.success) {
        setMessage('Password updated successfully!');
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    setPrefLoading(true);
    setPrefMessage(null);
    setPrefError(null);

    try {
      const res = await api.put('/users/me', {
        notificationPreferences: preferences
      });

      if (res.data?.success) {
        setPrefMessage('Preferences updated successfully!');
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      setPrefError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setPrefLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
          
          {/* Main Title */}
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-blue-600" />
              <span>Account Security & Preferences</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage login credentials, password security, and notification channels</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            
            {/* Card 1: Change Password */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Change Password</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Ensure your account uses a strong, random password</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{message}</span>
                  </motion.div>
                )}

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      required
                      placeholder="Enter your current password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Card 2: Notification Preferences */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>Notification Preferences</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Control which email and app notifications you receive</p>
              </div>
              
              <form onSubmit={handlePrefSubmit} className="space-y-4">
                {prefMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{prefMessage}</span>
                  </motion.div>
                )}

                {prefError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                    {prefError}
                  </div>
                )}

                <div className="space-y-3">
                  
                  {/* Order Updates */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Order Updates</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Notifications on purchases, shipping, and delivery transitions.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="orderUpdates"
                      checked={preferences.orderUpdates}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Wallet Alerts */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Wallet & Fair Coins</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Receive alerts when coins are credited, debited, or earned.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="walletAlerts"
                      checked={preferences.walletAlerts}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Security Alerts */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Security Alerts</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Important notices for verification, KYC, and credential updates.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="securityAlerts"
                      checked={preferences.securityAlerts}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                  {/* Promotional Messages */}
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Promotions & Deals</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Exclusive coupon drops, flash sales, and bonus rewards.</p>
                    </div>
                    <input
                      type="checkbox"
                      name="promotional"
                      checked={preferences.promotional}
                      onChange={handlePrefChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                  </div>

                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={prefLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                  >
                    {prefLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Preferences</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Card 3: Privacy & Data Rights (Account & Personal Data Deletion) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>Privacy &amp; Data Rights (Account &amp; Data Deletion)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Request closure of your account and purge of personal data in compliance with digital data protection principles.
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
                    <span>What happens when you request deletion?</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500">
                    <li><strong>Purged Personal Data:</strong> Your profile name, mobile number, email, saved addresses, wishlists, and uploaded verification files are permanently purged or anonymized.</li>
                    <li><strong>Legally Retained Records:</strong> Completed order records, GST invoices, and financial transaction ledgers are retained for up to 8 years under statutory Indian tax compliance and auditing requirements.</li>
                    <li><strong>Account Closure:</strong> You will no longer be able to log in or access prior rewards once the request is finalized.</li>
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

        {/* Modal: Confirmation & Reason */}
        {showDeletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Confirm Account &amp; Data Deletion Request</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  You are requesting the complete deletion of your BAAPOO MART account and associated personal identifiers.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                  <strong>Statutory Retention Notice:</strong> Tax invoices, accounting records, and transaction ledgers cannot be immediately erased due to mandatory 8-year statutory requirements under Indian GST and Income Tax laws. All personal names and direct contact details will be anonymized upon completion.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Optional Reason for Leaving</label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Tell us why you wish to delete your account (optional)..."
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
                <span>I understand that this action is irreversible and that my personal details will be anonymized while statutory financial records are legally retained.</span>
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
      </div>
  );
};

export default Settings;
