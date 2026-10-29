import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  AlertTriangle,
  Save,
  Power,
  Shield,
  Coins,
  Lock,
  CheckCircle,
  X,
  Image as ImageIcon,
  Plus,
  Edit3,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminSettings = () => {
  const [settings, setSettings] = useState({
    PLATFORM_NAME: 'BAAPOO MART',
    PLATFORM_TAGLINE: 'BUY INDIAN • BUILD INDIA',
    SUPPORT_EMAIL: 'support@baapoomart.com',
    BASE_COMMISSION_PERCENTAGE: 10,
    REFERRAL_COMMISSION_L1: 5,
    REFERRAL_COMMISSION_L2: 3,
    REFERRAL_COMMISSION_L3: 2,
    FAIR_COINS_SIGNUP_BONUS: 500,
    FAIR_COINS_REFERRAL_BONUS: 200,
    MAX_FAIR_COINS_PER_PURCHASE: 100,
    FAIR_COINS_REDEMPTION_LIMIT_PERCENT: 50,
    FAIR_COINS_PER_RUPEE: 10,
    MAINTENANCE_MODE: false,
    ALLOW_USER_REGISTRATION: true,
    ALLOW_VENDOR_ONBOARDING: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await superAdminService.getSettings();
      if (data?.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
          MAX_FAIR_COINS_PER_PURCHASE:
            data.settings.MAX_FAIR_COINS_PER_PURCHASE !== undefined
              ? Number(data.settings.MAX_FAIR_COINS_PER_PURCHASE)
              : 100,
          MAINTENANCE_MODE: Boolean(data.settings.MAINTENANCE_MODE === true || data.settings.MAINTENANCE_MODE === 'true'),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  // Banner Management States
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannerSearch, setBannerSearch] = useState('');
  const [bannerFilter, setBannerFilter] = useState('all');
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    imageSourceType: 'URL',
    imageUrl: '',
    heading: '',
    subtitle: '',
    buttonLabel: '',
    buttonDestinationUrl: '',
    altText: '',
    displayOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerFormError, setBannerFormError] = useState('');
  const [bannerSuccessMsg, setBannerSuccessMsg] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const data = await superAdminService.getBanners();
      setBanners(data?.banners || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBanners();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // Validate Maximum Fair Coins Per Purchase
    const maxCoins = settings.MAX_FAIR_COINS_PER_PURCHASE;
    if (
      maxCoins === '' ||
      maxCoins === null ||
      maxCoins === undefined ||
      isNaN(Number(maxCoins)) ||
      !Number.isInteger(Number(maxCoins)) ||
      Number(maxCoins) < 0
    ) {
      setError('Maximum Fair Coins Per Purchase must be a valid non-negative whole number.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await superAdminService.updateSettings(settings);
      setSuccessMsg('System configuration saved and synced across cluster.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggleClick = () => {
    setPendingMaintenanceState(!settings.MAINTENANCE_MODE);
    setMaintenanceConfirmOpen(true);
  };

  const confirmMaintenanceToggle = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await superAdminService.toggleMaintenanceMode(pendingMaintenanceState);
      setSettings((prev) => ({ ...prev, MAINTENANCE_MODE: res.isMaintenanceMode }));
      setSuccessMsg(`Maintenance Mode is now ${res.isMaintenanceMode ? 'ENABLED' : 'DISABLED'}`);
      setMaintenanceConfirmOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle maintenance mode');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      imageSourceType: 'URL',
      imageUrl: '',
      heading: '',
      subtitle: '',
      buttonLabel: '',
      buttonDestinationUrl: '',
      altText: '',
      displayOrder: banners.length > 0 ? Math.max(...banners.map((b) => b.displayOrder || 0)) + 1 : 0,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setBannerFormError('');
    setImagePreviewError(false);
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title || '',
      imageSourceType: b.imageSourceType || 'URL',
      imageUrl: b.imageUrl || '',
      heading: b.heading || '',
      subtitle: b.subtitle || '',
      buttonLabel: b.buttonLabel || '',
      buttonDestinationUrl: b.buttonDestinationUrl || '',
      altText: b.altText || '',
      displayOrder: b.displayOrder ?? 0,
      isActive: b.isActive !== false,
      startDate: b.startDate ? new Date(b.startDate).toISOString().slice(0, 16) : '',
      endDate: b.endDate ? new Date(b.endDate).toISOString().slice(0, 16) : '',
    });
    setBannerFormError('');
    setImagePreviewError(false);
    setBannerModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setBannerFormError('Invalid file type. Supported formats are JPEG, PNG, and WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerFormError('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setBannerFormError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1920;
        const maxH = 1080;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          if (width / height > maxW / maxH) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
        setBannerForm((prev) => ({
          ...prev,
          imageSourceType: 'UPLOAD',
          imageUrl: compressedDataUrl,
        }));
        setImagePreviewError(false);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      setBannerFormError('Banner title is required.');
      return;
    }
    if (!bannerForm.imageUrl.trim()) {
      setBannerFormError('Please select an image to upload or paste a direct image URL.');
      return;
    }
    if (bannerForm.imageSourceType === 'URL' && !/^https?:\/\/.+/i.test(bannerForm.imageUrl.trim())) {
      setBannerFormError('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    try {
      setBannerSaving(true);
      setBannerFormError('');

      if (editingBanner) {
        await superAdminService.updateBanner(editingBanner._id, bannerForm);
        setBannerSuccessMsg('Banner updated successfully!');
      } else {
        await superAdminService.createBanner(bannerForm);
        setBannerSuccessMsg('New banner added successfully!');
      }

      await fetchBanners();
      setBannerModalOpen(false);
      setTimeout(() => setBannerSuccessMsg(''), 4000);
    } catch (err) {
      setBannerFormError(err.response?.data?.message || 'Failed to save banner.');
    } finally {
      setBannerSaving(false);
    }
  };

  const handleToggleBannerStatus = async (b) => {
    try {
      await superAdminService.updateBannerStatus(b._id, !b.isActive);
      await fetchBanners();
    } catch (err) {
      console.error('Failed to toggle banner status:', err);
    }
  };

  const handleMoveOrder = async (b, delta) => {
    const newOrder = Math.max(0, (b.displayOrder || 0) + delta);
    try {
      await superAdminService.updateBannerDisplayOrder(b._id, newOrder);
      await fetchBanners();
    } catch (err) {
      console.error('Failed to change display order:', err);
    }
  };

  const handleDeleteBanner = async () => {
    if (!deletingBanner) return;
    try {
      setBannerSaving(true);
      await superAdminService.deleteBanner(deletingBanner._id);
      setDeleteConfirmOpen(false);
      setDeletingBanner(null);
      await fetchBanners();
      setBannerSuccessMsg('Banner deleted successfully!');
      setTimeout(() => setBannerSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete banner:', err);
    } finally {
      setBannerSaving(false);
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (bannerFilter === 'active' && !b.isActive) return false;
    if (bannerFilter === 'inactive' && b.isActive) return false;
    if (bannerSearch.trim()) {
      const q = bannerSearch.toLowerCase();
      const matchTitle = (b.title || '').toLowerCase().includes(q);
      const matchHeading = (b.heading || '').toLowerCase().includes(q);
      const matchSub = (b.subtitle || '').toLowerCase().includes(q);
      return matchTitle || matchHeading || matchSub;
    }
    return true;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Settings className="w-5 h-5" />
            </span>
            Platform & Security Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global governance parameters, economic reward ratios, platform flags, and maintenance controls.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all w-fit"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </motion.button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between font-medium">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </motion.div>
      )}

      {successMsg && (
        <motion.div variants={itemVariants} className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </motion.div>
      )}

      {/* Maintenance Mode Banner / Control */}
      <motion.div
        variants={itemVariants}
        className={`p-6 rounded-3xl border transition-all ${
          settings.MAINTENANCE_MODE
            ? 'bg-rose-50/80 border-rose-200 shadow-sm'
            : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl ${
                settings.MAINTENANCE_MODE ? 'bg-rose-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">System Maintenance Mode</h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    settings.MAINTENANCE_MODE
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {settings.MAINTENANCE_MODE ? 'ACTIVE (BLOCKING USERS)' : 'OFF (NORMAL TRAFFIC)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                When enabled, all incoming public and user customer requests receive a 503 Maintenance notice. Super Admins bypass this block automatically to perform maintenance.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleMaintenanceToggleClick}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
              settings.MAINTENANCE_MODE
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {settings.MAINTENANCE_MODE ? 'Deactivate Maintenance' : 'Activate Maintenance'}
          </motion.button>
        </div>
      </motion.div>

      {/* Settings Form Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Platform Details */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" /> Platform Identity & Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Platform Title / Brand</label>
              <input
                type="text"
                value={settings.PLATFORM_NAME || ''}
                onChange={(e) => setSettings({ ...settings, PLATFORM_NAME: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Platform Tagline</label>
              <input
                type="text"
                value={settings.PLATFORM_TAGLINE || ''}
                onChange={(e) => setSettings({ ...settings, PLATFORM_TAGLINE: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Official Support Email</label>
              <input
                type="email"
                value={settings.SUPPORT_EMAIL || ''}
                onChange={(e) => setSettings({ ...settings, SUPPORT_EMAIL: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2: Fair Coins & Referral Commissions */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-600" /> Fair Coins & Referral Ratios
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Base Platform Fee (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.BASE_COMMISSION_PERCENTAGE || ''}
                onChange={(e) => setSettings({ ...settings, BASE_COMMISSION_PERCENTAGE: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Referral Level 1 Commission (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.REFERRAL_COMMISSION_L1 || ''}
                onChange={(e) => setSettings({ ...settings, REFERRAL_COMMISSION_L1: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Referral Level 2 Commission (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.REFERRAL_COMMISSION_L2 || ''}
                onChange={(e) => setSettings({ ...settings, REFERRAL_COMMISSION_L2: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Signup Bonus (Coins)</label>
              <input
                type="number"
                min="0"
                value={settings.FAIR_COINS_SIGNUP_BONUS || ''}
                onChange={(e) => setSettings({ ...settings, FAIR_COINS_SIGNUP_BONUS: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Referral Reward (Coins)</label>
              <input
                type="number"
                min="0"
                value={settings.FAIR_COINS_REFERRAL_BONUS || ''}
                onChange={(e) => setSettings({ ...settings, FAIR_COINS_REFERRAL_BONUS: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Maximum Fair Coins Per Purchase</label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.MAX_FAIR_COINS_PER_PURCHASE !== undefined && settings.MAX_FAIR_COINS_PER_PURCHASE !== null ? settings.MAX_FAIR_COINS_PER_PURCHASE : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : (e.target.value.includes('.') ? e.target.value : Number(e.target.value));
                  setSettings({ ...settings, MAX_FAIR_COINS_PER_PURCHASE: val });
                }}
                placeholder="100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Maximum Fair Coins a customer can redeem in a single checkout.
              </p>
            </div>

            <div className="md:col-span-3 bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                      Fair Coins Conversion Rate
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Fixed Business Rule • Read-Only
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 mt-1 max-w-xl font-medium">
                    The platform conversion rate is permanently fixed: <strong>10 Fair Coins = ₹1</strong> (1 Fair Coin = ₹0.10). This business rule is authoritative, immutable, and cannot be modified.
                  </p>
                </div>
                <div className="flex-shrink-0 bg-white border border-amber-300/80 rounded-xl px-5 py-2.5 text-center shadow-xs">
                  <div className="text-base font-black text-amber-950 font-mono">10 Coins = ₹1</div>
                  <div className="text-[10px] text-amber-700 font-bold">1 Fair Coin = ₹0.10</div>
                </div>
              </div>
              <div className="text-[11px] font-bold text-amber-900 bg-amber-100/70 px-3.5 py-2 rounded-xl flex items-center justify-between border border-amber-200/60">
                <span>Authoritative Platform Rule:</span>
                <span className="font-mono font-black">
                  10 Fair Coins = ₹1 (1 Fair Coin = ₹0.10 • Permanent & Locked)
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Feature Toggles */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" /> Platform Registration Feature Flags
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Allow Customer Self-Registration</p>
                <p className="text-[11px] text-slate-500">Permit new users to register via /register</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ALLOW_USER_REGISTRATION !== false}
                onChange={(e) => setSettings({ ...settings, ALLOW_USER_REGISTRATION: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Allow Vendor Onboarding</p>
                <p className="text-[11px] text-slate-500">Accept vendor merchant registration submissions</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ALLOW_VENDOR_ONBOARDING !== false}
                onChange={(e) => setSettings({ ...settings, ALLOW_VENDOR_ONBOARDING: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 4: Homepage Showcase Banners & Top Selling Sections Controls */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Homepage Banners & Top Selling Showcase Control
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Super Admin Authority
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Flash Sale Banner Config */}
            <div className="p-4 bg-gradient-to-r from-rose-50/70 to-amber-50/70 border border-rose-200 rounded-2xl space-y-3">
              <div className="font-bold text-rose-900 text-xs uppercase tracking-wider">Top Flash Sale Banner Configuration</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Banner Badge Text</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_BADGE || 'LIMITED TIME FLASH SALE'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_BADGE: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Banner Main Title</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_TITLE || 'Supercharged Deals • Up to 65% OFF'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_TITLE: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Banner Subtitle Description</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_SUBTITLE || 'Verified genuine products. Extra 2X Fair Coins credited instantly to your wallet.'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_SUBTITLE: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Button Label</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_BUTTON_TEXT || 'VIEW FLASH DEALS'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_BUTTON_TEXT: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Button Destination Link</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_BUTTON_LINK || '/products'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_BUTTON_LINK: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                {/* Timer Controls */}
                <div className="md:col-span-2 pt-1 border-t border-rose-200/60">
                  <label className="block text-slate-700 font-semibold mb-1">Countdown Timer Duration (HH : MM : SS)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      placeholder="Hours"
                      value={settings.BANNER_FLASH_SALE_HOURS ?? 8}
                      onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_HOURS: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center font-mono font-bold"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minutes"
                      value={settings.BANNER_FLASH_SALE_MINUTES ?? 21}
                      onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_MINUTES: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center font-mono font-bold"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Seconds"
                      value={settings.BANNER_FLASH_SALE_SECONDS ?? 52}
                      onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_SECONDS: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Selling Sections Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Top Selling Products Section</span>
                  <input
                    type="checkbox"
                    checked={settings.SHOW_TOP_SELLING_PRODUCTS !== 'false' && settings.SHOW_TOP_SELLING_PRODUCTS !== false}
                    onChange={(e) => setSettings({ ...settings, SHOW_TOP_SELLING_PRODUCTS: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={settings.TOP_SELLING_PRODUCTS_TITLE || 'Top Selling Products & Featured Marketplace Picks'}
                  onChange={(e) => setSettings({ ...settings, TOP_SELLING_PRODUCTS_TITLE: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Top Selling Brands Section</span>
                  <input
                    type="checkbox"
                    checked={settings.SHOW_TOP_SELLING_BRANDS !== 'false' && settings.SHOW_TOP_SELLING_BRANDS !== false}
                    onChange={(e) => setSettings({ ...settings, SHOW_TOP_SELLING_BRANDS: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={settings.TOP_SELLING_BRANDS_TITLE || 'Top Selling Brands'}
                  onChange={(e) => setSettings({ ...settings, TOP_SELLING_BRANDS_TITLE: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Top Verified Sellers Section</span>
                  <input
                    type="checkbox"
                    checked={settings.SHOW_TOP_SELLERS !== 'false' && settings.SHOW_TOP_SELLERS !== false}
                    onChange={(e) => setSettings({ ...settings, SHOW_TOP_SELLERS: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={settings.TOP_SELLERS_TITLE || 'Top Verified Sellers & Merchants'}
                  onChange={(e) => setSettings({ ...settings, TOP_SELLERS_TITLE: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </form>

      {/* Section 5: Homepage Dynamic Banner Management */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    Dynamic Homepage Banner Management
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      Live Homepage Control
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Appoint, upload, edit, reorder, preview, and toggle customer homepage hero showcase banners.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchBanners}
                disabled={bannersLoading}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition text-xs font-semibold flex items-center gap-1.5"
                title="Refresh Banners"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${bannersLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddBanner}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Banner</span>
              </button>
            </div>
          </div>

          {/* Banner Success Message */}
          {bannerSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bannerSuccessMsg}</span>
            </div>
          )}

          {/* Banner Search and Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search banners by title or text..."
                value={bannerSearch}
                onChange={(e) => setBannerSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-500 text-[11px] font-semibold">Filter:</span>
              <div className="inline-flex rounded-xl bg-white border border-slate-200 p-0.5">
                {['all', 'active', 'inactive'].map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setBannerFilter(filterKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      bannerFilter === filterKey
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Banners List */}
          {bannersLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Loading banners...</span>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">No Banners Found</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {bannerSearch || bannerFilter !== 'all'
                    ? 'No banners match your active filter criteria.'
                    : 'No dynamic banners have been created yet. Click "Add Banner" to upload an image or add an image URL.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddBanner}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Banner</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBanners.map((banner) => (
                <div
                  key={banner._id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                >
                  {/* Left: Order, Thumbnail, Details */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Order Controls */}
                    <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(banner, -1)}
                        className="text-slate-400 hover:text-indigo-600 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-black text-slate-700">#{banner.displayOrder ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(banner, 1)}
                        className="text-slate-400 hover:text-indigo-600 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      <img
                        src={banner.imageUrl}
                        alt={banner.altText || banner.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = '/images/baapoo-mart-logo.png';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 text-[8px] font-bold px-1 rounded bg-black/60 text-white uppercase">
                        {banner.imageSourceType === 'UPLOAD' ? 'Upload' : 'URL'}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{banner.title}</span>
                        {banner.heading && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100 shrink-0">
                            {banner.heading}
                          </span>
                        )}
                      </div>
                      {banner.subtitle && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{banner.subtitle}</p>
                      )}
                      {banner.buttonLabel && banner.buttonDestinationUrl && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Button: {banner.buttonLabel}</span>
                          <span className="text-slate-300">•</span>
                          <span>Link: {banner.buttonDestinationUrl}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status toggle & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Status Pill Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleBannerStatus(banner)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={banner.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${banner.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{banner.isActive ? 'Active' : 'Inactive'}</span>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewBanner(banner);
                          setPreviewModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition"
                        title="Preview Banner"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditBanner(banner)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition"
                        title="Edit Banner"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingBanner(banner);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      {/* Modal 1: Add or Edit Banner Modal */}
      <AnimatePresence>
        {bannerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-xl p-6 space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingBanner ? 'Edit Homepage Banner' : 'Add New Homepage Banner'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure image and promotional text for live showcase.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bannerFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{bannerFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                {/* Banner Title */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Banner Title / Internal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwalifest Mega Sale Banner"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                {/* Image Source Selection */}
                <div className="space-y-2">
                  <label className="block text-slate-700 font-bold">
                    Image Source <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, imageSourceType: 'UPLOAD' })}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition ${
                        bannerForm.imageSourceType === 'UPLOAD'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload from Computer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, imageSourceType: 'URL' })}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition ${
                        bannerForm.imageSourceType === 'URL'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Direct Image URL</span>
                    </button>
                  </div>

                  {/* Upload Field */}
                  {bannerForm.imageSourceType === 'UPLOAD' ? (
                    <div className="space-y-2">
                      <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition text-center">
                        <Upload className="w-6 h-6 text-indigo-500" />
                        <div>
                          <span className="font-bold text-slate-800 text-xs">Choose Image File</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">JPEG, PNG, or WebP (Max 5MB)</span>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    /* Image URL Field */
                    <div>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-... or https://example.com/banner.jpg"
                        value={bannerForm.imageUrl}
                        onChange={(e) => {
                          setBannerForm({ ...bannerForm, imageUrl: e.target.value });
                          setImagePreviewError(false);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  )}

                  {/* Image Preview Box */}
                  {bannerForm.imageUrl && (
                    <div className="relative rounded-2xl border border-slate-200 p-2 bg-slate-50 flex items-center justify-center max-h-44 overflow-hidden">
                      {imagePreviewError ? (
                        <div className="py-4 text-center text-rose-500 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Image URL is invalid or inaccessible</span>
                        </div>
                      ) : (
                        <img
                          src={bannerForm.imageUrl}
                          alt="Banner Preview"
                          className="max-h-40 w-auto object-contain rounded-xl"
                          onError={() => setImagePreviewError(true)}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Optional Promotional Text Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Heading Text <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Special Promotion"
                      value={bannerForm.heading}
                      onChange={(e) => setBannerForm({ ...bannerForm, heading: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Subtitle Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Authentic Handloom & Artisan Collections"
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Button Label <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shop Now"
                      value={bannerForm.buttonLabel}
                      onChange={(e) => setBannerForm({ ...bannerForm, buttonLabel: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Button Destination Link <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /products or /products?category=fashion-apparel"
                      value={bannerForm.buttonDestinationUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, buttonDestinationUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Alt Text for Accessibility <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Indian Artisans Collection Banner"
                      value={bannerForm.altText}
                      onChange={(e) => setBannerForm({ ...bannerForm, altText: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={bannerForm.displayOrder}
                      onChange={(e) => setBannerForm({ ...bannerForm, displayOrder: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>

                {/* Active Status Checkbox */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="bannerActiveCheckbox"
                    checked={bannerForm.isActive}
                    onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                  <label htmlFor="bannerActiveCheckbox" className="font-bold text-slate-800 cursor-pointer">
                    Active (Show on Customer Homepage)
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBannerModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bannerSaving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
                  >
                    {bannerSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingBanner ? 'Update Banner' : 'Create Banner'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Preview Banner Modal */}
      <AnimatePresence>
        {previewModalOpen && previewBanner && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Homepage Live Preview</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Exact Home Showcase Card Replica */}
              <div className="relative bg-white rounded-3xl border border-slate-200 p-4 shadow-md space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-[#F7F7F9] aspect-4/3 flex items-center justify-center p-2">
                  <img
                    src={previewBanner.imageUrl}
                    alt={previewBanner.altText || previewBanner.title}
                    className="max-h-48 w-full object-contain"
                    onError={(e) => {
                      e.target.src = '/images/baapoo-mart-logo.png';
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/90 text-[#30358F] font-black text-[9px] uppercase tracking-wider border border-slate-200 shadow-xs">
                    {previewBanner.title}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F7941D]">
                      {previewBanner.heading || 'Special Promotion'}
                    </span>
                    {previewBanner.buttonLabel && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {previewBanner.buttonLabel}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-[#222222]">
                    {previewBanner.heading || previewBanner.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {previewBanner.subtitle || 'Discover quality authentic collections direct from Indian merchants.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && deletingBanner && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-sm p-6 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Delete Banner "{deletingBanner.title}"?
              </h3>
              <p className="text-xs text-slate-500">
                This banner will be permanently removed and will no longer appear on the customer homepage.
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBanner}
                  disabled={bannerSaving}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  {bannerSaving ? 'Deleting...' : 'Delete Banner'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {maintenanceConfirmOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-sm p-6 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {pendingMaintenanceState ? 'Activate Maintenance Mode?' : 'Deactivate Maintenance Mode?'}
              </h3>
              <p className="text-xs text-slate-500">
                {pendingMaintenanceState
                  ? 'All normal customer traffic and store orders will be blocked with a 503 Maintenance page. You will still have full access.'
                  : 'The platform will immediately resume serving live traffic to all customers and vendors.'}
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMaintenanceToggle}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors ${
                    pendingMaintenanceState ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {saving ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperAdminSettings;
