import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../../store/authSlice';
import { ShoppingBag, Lock, Mail, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthLayout } from '../../components/auth/AuthLayout';

export const CustomerLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || '/customer/dashboard';

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      if (user.role === 'CUSTOMER' || user.role === 'USER') {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, dispatch, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) return;
    const result = await dispatch(
      loginUser({
        email: emailOrPhone.trim(),
        password,
        portal: 'CUSTOMER',
      })
    );
    if (!result.error) {
      navigate('/customer/dashboard');
    }
  };

  return (
    <AuthLayout
      badge="FairKart Shopper Portal"
      title="Shop, Earn Coins & Win Live Rewards"
      subtitle="Join thousands of shoppers earning guaranteed Fair Coins on every verified checkout, spin wheel bonuses, and 9-level upline partner commissions."
      imageSrc="/images/customer-auth.jpg"
      imageAlt="FairKart Shopping Rewards"
      theme="blue"
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-blue-100/90 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-600 border border-blue-200/60 mb-3 shadow-xs">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100/60 text-blue-700 text-[10px] font-black uppercase tracking-wider mb-2">
            FairKart Customer
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to your account, orders & Fair Coins wallet</p>
        </div>

        {/* Error Alert */}
        {error && (
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email or Mobile Number</label>
            <div className="relative">
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com or +91 9876543210"
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
                  alert('Password reset link will be sent to your registered email address.');
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
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
              setEmailOrPhone('user@fairkart.dev');
              setPassword('Password@123');
            }}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Fill Demo (user@fairkart.dev)
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center">
          <p className="text-xs text-slate-500">
            New to FairKart?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-bold">
              Create Customer Account
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default CustomerLogin;
