import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/authSlice';
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Clock,
  Ban,
  ShieldAlert,
  Eye,
  EyeOff,
  TrendingUp,
  Banknote,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const VendorLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [vendorNotice, setVendorNotice] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      if (user.role === 'VENDOR') {
        if (user.vendor?.status === 'APPROVED') {
          navigate('/vendor/dashboard');
        } else if (user.vendor?.status === 'PENDING' || user.vendor?.status === 'UNDER_REVIEW') {
          setVendorNotice({
            type: 'PENDING',
            title: 'Waiting for Admin Approval',
            message: 'Your merchant application has been submitted and is currently being verified by our operations team. You will receive an email once approved.',
          });
        }
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) return;
    setVendorNotice(null);

    const result = await dispatch(
      loginUser({
        email: emailOrPhone.trim(),
        password,
        portal: 'VENDOR',
      })
    );

    if (!result.error) {
      const u = result.payload.user;
      if (u?.vendor && u.vendor.status !== 'APPROVED') {
        if (u.vendor.status === 'PENDING' || u.vendor.status === 'UNDER_REVIEW') {
          setVendorNotice({
            type: 'PENDING',
            title: 'Waiting for Admin Approval',
            message: 'Your merchant application is under review. Our admin team will approve your business profile shortly.',
          });
        } else if (u.vendor.status === 'REJECTED') {
          setVendorNotice({
            type: 'REJECTED',
            title: 'Application Rejected',
            message: 'Your vendor registration did not meet the criteria or was rejected by admin. Please contact support.',
          });
        } else if (u.vendor.status === 'SUSPENDED' || u.vendor.status === 'BLOCKED') {
          setVendorNotice({
            type: 'SUSPENDED',
            title: 'Account Suspended',
            message: 'Your vendor account has been temporarily suspended. Please reach out to merchant operations.',
          });
        }
      } else {
        navigate('/vendor/dashboard');
      }
    }
  };

  return (
    <AuthLayout
      badge="FairKart Merchant Hub"
      title="Scale Your Brand Across India with FairKart"
      subtitle="Comprehensive vendor catalog management, multi-channel product distribution, real-time inventory tracking, and guaranteed bank payouts."
      imageSrc="/images/vendor-auth.jpg"
      imageAlt="FairKart Vendor Portal"
      features={[
        { icon: Banknote, text: 'Fast automated vendor payouts & AES-256 bank encryption' },
        { icon: TrendingUp, text: 'Transparent analytics, sales trends & commission reports' },
        { icon: QrCode, text: 'Store QR code for local shopper walk-in rewards' },
      ]}
      theme="emerald"
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-blue-100/90 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-700 border border-blue-200/60 mb-3 shadow-xs">
            <Store className="w-7 h-7" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100/70 text-blue-800 text-[10px] font-black uppercase tracking-wider mb-2">
            Vendor Merchant Portal
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">FairKart Vendor Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Store & Products</p>
        </div>

        {/* Vendor Status Notice (PENDING / REJECTED / SUSPENDED) */}
        <AnimatePresence>
          {vendorNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-2xl border ${
                vendorNotice.type === 'PENDING'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : vendorNotice.type === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {vendorNotice.type === 'PENDING' && <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                {vendorNotice.type === 'REJECTED' && <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                {vendorNotice.type === 'SUSPENDED' && <ShieldAlert className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />}
                <div>
                  <h4 className="font-bold text-xs">{vendorNotice.title}</h4>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-90">{vendorNotice.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* General Error */}
        {error && !vendorNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Vendor Email / Mobile</label>
            <div className="relative">
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="store@vendor.com or +91 9876543210"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact merchant administration or reset using registered email.');
                }}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">Need demo login?</span>
          <button
            type="button"
            onClick={() => {
              setEmailOrPhone('vendor@fairkart.dev');
              setPassword('Password@123');
            }}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline"
          >
            Fill Demo (vendor@fairkart.dev)
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-center">
          <p className="text-xs text-slate-500">
            New Vendor?{' '}
            <Link to="/vendor/register" className="text-blue-600 hover:underline font-bold">
              Apply as Vendor
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VendorLogin;
