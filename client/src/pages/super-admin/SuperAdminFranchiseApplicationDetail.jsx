import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  ShieldCheck,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  Eye,
  ExternalLink,
  Download,
  Send,
  MessageSquare,
  Lock,
  RefreshCw,
  HelpCircle,
  File,
  Check,
} from 'lucide-react';
import franchiseVendorService from '../../services/franchiseVendorService';

export const SuperAdminFranchiseApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO' | 'UNDER_REVIEW'
  const [rejectionReason, setRejectionReason] = useState('');
  const [moreInfoReason, setMoreInfoReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Document modal preview
  const [previewDoc, setPreviewDoc] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await franchiseVendorService.getFranchiseApplicationById(id);
      if (res) {
        setData(res);
      } else {
        setError('Application details not found');
      }
    } catch (err) {
      console.error('Failed to load application:', err);
      setError(err.response?.data?.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleOpenReviewModal = (action) => {
    setReviewAction(action);
    setRejectionReason('');
    setMoreInfoReason('');
    setReviewNotes(data?.vendor?.applicationReviewNotes || '');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    if (reviewAction === 'REQUEST_MORE_INFO' && !moreInfoReason.trim()) {
      showToast('Please explain what additional information is required', 'error');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await franchiseVendorService.reviewFranchiseApplication(id, {
        action: reviewAction,
        rejectionReason,
        moreInfoReason,
        reviewNotes,
      });

      showToast(`Application successfully updated: ${reviewAction}`, 'success');
      setShowReviewModal(false);
      loadApplication();
    } catch (err) {
      console.error('Failed to submit review:', err);
      showToast(err.response?.data?.message || 'Failed to update review status', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const openDocumentViewer = (doc) => {
    if (!doc || !doc.fileUrl) {
      showToast('Document file is not available', 'error');
      return;
    }
    // If it's a data URL or valid URL, open in new tab
    if (doc.fileUrl.startsWith('data:') || doc.fileUrl.startsWith('http')) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${doc.fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    } else {
      window.open(doc.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold">Loading Franchise Application & KYC Details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/super-admin/franchise-applications')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications List
        </button>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
          <AlertTriangle className="w-10 h-10 mx-auto text-rose-600 mb-2" />
          <h2 className="text-lg font-bold text-rose-900">Application Not Found</h2>
          <p className="text-sm text-rose-700 mt-1">{error || 'Unable to retrieve application details.'}</p>
        </div>
      </div>
    );
  }

  const { vendor, user, business, address, kyc, bank, activities } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/super-admin/franchise-applications')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications List
        </button>

        <div className="flex items-center gap-2">
          {vendor.applicationStatus !== 'UNDER_REVIEW' && vendor.applicationStatus !== 'APPROVED' && (
            <button
              onClick={() => handleOpenReviewModal('UNDER_REVIEW')}
              className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs hover:bg-amber-100 transition"
            >
              Mark Under Review
            </button>
          )}

          <button
            onClick={() => handleOpenReviewModal('REQUEST_MORE_INFO')}
            className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs hover:bg-purple-100 transition"
          >
            Request More Info
          </button>

          <button
            onClick={() => handleOpenReviewModal('REJECT')}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition"
          >
            Reject Application
          </button>

          <button
            onClick={() => handleOpenReviewModal('APPROVE')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            Approve & Activate Vendor
          </button>
        </div>
      </div>

      {/* Top Banner with Key Identifiers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-xl text-indigo-700 shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-black text-slate-900">
                {user?.name || vendor.storeName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {user?.username || vendor.franchiseCode}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {vendor.storeName || business?.storeName || 'Franchise Vendor Store'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {user?.phone || 'No phone'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email || 'No email'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {address?.stateName || 'State'}, {address?.districtName || 'District'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="flex items-center gap-4 md:border-l md:border-slate-100 md:pl-6">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Application Status</p>
            <p className="text-sm font-black text-slate-800 mt-0.5">
              {vendor.applicationStatus || 'PENDING_APPLICATION'}
            </p>
            <p className="text-[11px] text-slate-500">
              KYC: <span className="font-bold text-slate-700">{vendor.kycStatus || 'PENDING'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 7 Organized Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Appointment & Invitation Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
            <Calendar className="w-4 h-4" />
            1. Appointment and Invitation Details
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Appointment Date</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {vendor.appointedAt ? new Date(vendor.appointedAt).toLocaleString('en-IN') : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Appointed By</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {vendor.appointedBy?.name || 'Super Admin'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Franchise Code</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{vendor.franchiseCode || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Invitation Status</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                  {vendor.invitationStatus || 'PENDING'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Assigned Territory Level</p>
              <p className="font-semibold text-slate-900 mt-0.5">{vendor.territoryLevel || 'TALUK'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Invitation Expiry</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {vendor.invitationExpiresAt
                  ? new Date(vendor.invitationExpiresAt).toLocaleDateString('en-IN')
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Vendor Account Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
            <User className="w-4 h-4" />
            2. Vendor Account Information
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Applicant Name</p>
              <p className="font-semibold text-slate-900 mt-0.5">{user?.name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Assigned Username</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{user?.username || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Account Role</p>
              <p className="font-semibold text-slate-900 mt-0.5">{user?.role || 'VENDOR'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Account Status</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                  {vendor.status || user?.status || 'PENDING'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Password Setup Status</p>
              <p className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
                {user?.passwordConfigured ? 'Password Configured (Encrypted)' : 'Configured via Invitation'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Account Created</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Business Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
            <Building2 className="w-4 h-4" />
            3. Business Information
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Store / Business Name</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {business?.storeName || vendor.storeName || '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Business Type</p>
              <p className="font-semibold text-slate-900 mt-0.5">{business?.businessType || 'Retail'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 font-medium">Store Description</p>
              <p className="font-medium text-slate-700 mt-0.5">
                {business?.storeDescription || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Contact & Location Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
            <MapPin className="w-4 h-4" />
            4. Contact and Location Details
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Primary Phone</p>
              <p className="font-semibold text-slate-900 mt-0.5">{user?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">WhatsApp Number</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {business?.whatsappNumber || user?.phone || '—'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 font-medium">Business Address</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {address?.addressLine1 || '—'}
                {address?.addressLine2 ? `, ${address.addressLine2}` : ''}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">State / District / Taluk</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {address?.stateName || '—'} / {address?.districtName || '—'} / {address?.talukName || '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">PIN Code</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{address?.pincode || '—'}</p>
            </div>
          </div>
        </div>

        {/* Section 5: KYC Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            5. KYC Information
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Identity Document Type</p>
              <p className="font-semibold text-slate-900 mt-0.5">{kyc?.documentType || 'Aadhaar'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Identity Document Number</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{kyc?.documentNumber || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">PAN / Business Tax Number</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{kyc?.panNumber || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">KYC Verification Status</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  {kyc?.status || vendor.kycStatus || 'PENDING'}
                </span>
              </p>
            </div>
            {kyc?.verifiedAt && (
              <div className="col-span-2">
                <p className="text-slate-400 font-medium">Verified On</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {new Date(kyc.verifiedAt).toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Uploaded KYC Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
            <FileText className="w-4 h-4" />
            6. Uploaded KYC Documents
          </div>
          {kyc?.documents && kyc.documents.length > 0 ? (
            <div className="space-y-3">
              {kyc.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{doc.name || `Document ${idx + 1}`}</p>
                      <p className="text-[11px] text-slate-500">
                        {doc.type} • {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'PDF'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openDocumentViewer(doc)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold">No document attachments uploaded</p>
              <p className="text-slate-400 mt-0.5">The vendor has not submitted KYC PDF files yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 7: Application Status & Review History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-indigo-700 font-bold text-sm">
          <Clock className="w-4 h-4" />
          7. Application Status and Review History
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-400 font-medium">Submitted At</p>
            <p className="font-bold text-slate-900 mt-1">
              {vendor.applicationSubmittedAt
                ? new Date(vendor.applicationSubmittedAt).toLocaleString('en-IN')
                : 'Not yet submitted by vendor'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-400 font-medium">Last Reviewed At</p>
            <p className="font-bold text-slate-900 mt-1">
              {vendor.applicationReviewedAt
                ? new Date(vendor.applicationReviewedAt).toLocaleString('en-IN')
                : 'Pending initial review'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-400 font-medium">Review Notes</p>
            <p className="font-medium text-slate-700 mt-1 italic">
              {vendor.applicationReviewNotes || 'No internal notes added.'}
            </p>
          </div>
        </div>

        {vendor.applicationRejectionReason && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            <p className="font-bold flex items-center gap-1.5 text-rose-700">
              <XCircle className="w-4 h-4" /> Rejection Reason:
            </p>
            <p className="mt-1 font-medium">{vendor.applicationRejectionReason}</p>
          </div>
        )}

        {vendor.applicationMoreInfoReason && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
            <p className="font-bold flex items-center gap-1.5 text-purple-700">
              <AlertTriangle className="w-4 h-4" /> Additional Information Requested:
            </p>
            <p className="mt-1 font-medium">{vendor.applicationMoreInfoReason}</p>
          </div>
        )}

        {/* Activity Timeline */}
        {activities && activities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Vendor Activity History
            </h4>
            <div className="space-y-2">
              {activities.map((act) => (
                <div
                  key={act._id}
                  className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50/75 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-bold text-slate-800">{act.eventType}</span>
                    <span className="text-slate-500">— {act.description}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {new Date(act.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Action Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {reviewAction === 'APPROVE' && 'Approve Franchise Vendor Application'}
                {reviewAction === 'REJECT' && 'Reject Franchise Vendor Application'}
                {reviewAction === 'REQUEST_MORE_INFO' && 'Request More Information'}
                {reviewAction === 'UNDER_REVIEW' && 'Set Application Status to Under Review'}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {reviewAction === 'APPROVE' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <p className="font-bold">Confirmation</p>
                  <p className="mt-0.5">
                    Approving this application will mark the vendor as <strong>APPROVED</strong>, activate their account
                    status to <strong>ACTIVE</strong>, and mark their KYC documents as <strong>VERIFIED</strong>.
                  </p>
                </div>
              )}

              {reviewAction === 'REJECT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the specific reason for rejecting this vendor application..."
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              )}

              {reviewAction === 'REQUEST_MORE_INFO' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    What information or documentation is missing? <span className="text-purple-500">*</span>
                  </label>
                  <textarea
                    required
                    value={moreInfoReason}
                    onChange={(e) => setMoreInfoReason(e.target.value)}
                    placeholder="Specify clearly what documents or details the vendor needs to correct or provide..."
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Review Notes (Optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Private internal notes for Super Admin audit trail..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`px-5 py-2 rounded-xl text-white font-bold transition shadow-md disabled:opacity-50 ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      : reviewAction === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                      : reviewAction === 'REQUEST_MORE_INFO'
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                  }`}
                >
                  {isSubmittingReview ? 'Saving...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminFranchiseApplicationDetail;
