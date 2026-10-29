import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  Save,
  History,
  Eye,
  Edit3,
  Calendar,
  Layers,
  CheckCircle,
  AlertCircle,
  Store,
  Users,
  Lock,
  Cookie,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';

const DOCUMENT_TABS = [
  { key: 'VENDOR_TERMS', label: 'Vendor Terms & Conditions', icon: Store, role: 'Vendor Agreement' },
  { key: 'CUSTOMER_TERMS', label: 'Customer Terms & Conditions', icon: Users, role: 'Customer Agreement' },
  { key: 'PRIVACY_POLICY', label: 'Privacy Policy', icon: Lock, role: 'Data Protection' },
  { key: 'COOKIE_POLICY', label: 'Cookie Policy', icon: Cookie, role: 'Cookie Consent' },
];

export const SuperAdminLegalDocuments = () => {
  const [selectedType, setSelectedType] = useState('VENDOR_TERMS');
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMode, setActiveMode] = useState('edit'); // 'edit', 'preview', 'history'
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Form states for the currently selected document
  const [formData, setFormData] = useState({
    title: '',
    version: '1.0',
    effectiveDate: '',
    isPublished: true,
    content: '',
  });

  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/legal-documents');
      const docs = res.data?.data || [];
      const docMap = {};
      docs.forEach((d) => {
        docMap[d.type] = d;
      });
      setDocuments(docMap);

      if (docMap[selectedType]) {
        loadDocIntoForm(docMap[selectedType]);
      }
    } catch (err) {
      console.error('Failed to load legal documents:', err);
      showNotification('error', err.response?.data?.message || 'Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  };

  const loadDocIntoForm = (doc) => {
    setFormData({
      title: doc.title || '',
      version: doc.version || '1.0',
      effectiveDate: doc.effectiveDate ? doc.effectiveDate.split('T')[0] : '',
      isPublished: Boolean(doc.isPublished),
      content: doc.content || '',
    });
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (documents[selectedType]) {
      loadDocIntoForm(documents[selectedType]);
    }
    if (activeMode === 'history') {
      fetchHistory(selectedType);
    }
  }, [selectedType]);

  const handleTabSelect = (type) => {
    setSelectedType(type);
    setSelectedHistoryItem(null);
  };

  const fetchHistory = async (type) => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/super-admin/legal-documents/${type}/history`);
      setHistoryList(res.data?.data?.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleModeSwitch = (mode) => {
    setActiveMode(mode);
    if (mode === 'history') {
      fetchHistory(selectedType);
    }
  };

  const handleSaveAndPublish = async (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      showNotification('error', 'Document content cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put(`/super-admin/legal-documents/${selectedType}`, formData);
      const updated = res.data?.data;
      setDocuments((prev) => ({ ...prev, [selectedType]: updated }));
      loadDocIntoForm(updated);
      showNotification('success', `Successfully published version ${updated.version} of ${updated.title}`);
    } catch (err) {
      console.error('Failed to publish document:', err);
      showNotification('error', err.response?.data?.message || 'Failed to publish legal document.');
    } finally {
      setSaving(false);
    }
  };

  const currentDoc = documents[selectedType];
  const activeTabMeta = DOCUMENT_TABS.find((t) => t.key === selectedType);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#30358F] text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal Compliance & Terms Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Legal Documents & Policy Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish and manage terms, privacy, and cookie policies with full immutable version history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh documents"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DOCUMENT_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = selectedType === tab.key;
          const doc = documents[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => handleTabSelect(tab.key)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-white border-[#30358F] ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#30358F] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  v{doc?.version || '1.0'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{tab.label}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{tab.role}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Document Management Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Workspace Top Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-black text-slate-900 text-sm">{activeTabMeta?.label}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Published: v{currentDoc?.version || '1.0'}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => handleModeSwitch('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeMode === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeMode === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Version History ({currentDoc?.history?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Content based on Active Mode */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#30358F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Loading document data...</p>
          </div>
        ) : activeMode === 'edit' ? (
          <form onSubmit={handleSaveAndPublish} className="p-6 space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 text-xs font-semibold text-slate-900 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Version <span className="text-slate-400 font-normal">(e.g. 1.0, 1.1)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0"
                  className="w-full bg-slate-50 text-xs font-mono font-bold text-slate-900 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full bg-slate-50 text-xs font-medium text-slate-900 rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Markdown Content Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Document Body (Markdown Supported)</label>
                <span className="text-[11px] text-slate-400">Use standard Markdown headers (##), lists, and text</span>
              </div>
              <textarea
                rows={18}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-slate-50 text-xs font-mono text-slate-800 rounded-2xl p-4 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed resize-y"
                placeholder="Enter markdown legal content here..."
              />
            </div>

            {/* Footer Control Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">Audit Safety:</span> Publishing a new version will automatically archive the current version to the immutable audit trail.
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Publishing...' : 'Publish Document Version'}</span>
              </button>
            </div>
          </form>
        ) : activeMode === 'preview' ? (
          <div className="p-8 max-w-4xl mx-auto space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="font-bold">Live Document Preview</span>
              </div>
              <span className="font-mono font-bold">Version {formData.version}</span>
            </div>
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
              {formData.content}
            </div>
          </div>
        ) : (
          /* Version History Mode */
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Historical Versions & Audit Trail</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All previously published revisions and publishing administrator audit logs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchHistory(selectedType)}
                className="text-xs text-[#30358F] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh History</span>
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading version history...</div>
            ) : historyList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No prior archived versions yet</p>
                <p className="mt-1">Initial version 1.0 is currently active. Any edits will create revision snapshots here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((hist, idx) => (
                  <div
                    key={hist._id || idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">Version {hist.version}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          Archived
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-3">
                        <span>Published: {new Date(hist.publishedAt || hist.createdAt).toLocaleString('en-IN')}</span>
                        {hist.publishedBy?.name && (
                          <span>• By: {hist.publishedBy.name} ({hist.publishedBy.email})</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedHistoryItem(hist)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold transition text-xs shrink-0 self-start sm:self-auto"
                    >
                      View Archived Content
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Modal to view archived content snapshot */}
            {selectedHistoryItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-100">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        Snapshot: Version {selectedHistoryItem.version}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Effective date: {new Date(selectedHistoryItem.effectiveDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedHistoryItem(null)}
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>
                  <div className="overflow-y-auto my-4 p-4 bg-slate-50 rounded-2xl whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed">
                    {selectedHistoryItem.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminLegalDocuments;
