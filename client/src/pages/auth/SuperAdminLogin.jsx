import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, verifyMfa, clearAuthError } from '../../store/authSlice';
import {
  Crown,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Smartphone,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SuperAdminLogin = () => {
  // Step 1: 'CREDENTIALS' | Step 2: 'MFA_CHALLENGE'
  const [step, setStep] = useState('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MFA state
  const [totpCode, setTotpCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [mfaSessionToken, setMfaSessionToken] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user, mfaPending, mfaToken } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
      navigate('/super-admin/dashboard');
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  useEffect(() => {
    if (mfaPending && mfaToken) {
      setMfaSessionToken(mfaToken);
      setStep('MFA_CHALLENGE');
    }
  }, [mfaPending, mfaToken]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const result = await dispatch(
      loginUser({
        email: email.trim(),
        password,
        portal: 'SUPER_ADMIN',
      })
    );

    if (!result.error) {
      if (result.payload.mfaRequired) {
        setMfaSessionToken(result.payload.mfaToken);
        setStep('MFA_CHALLENGE');
      } else {
        navigate('/super-admin/dashboard');
      }
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!totpCode.trim() || !mfaSessionToken) return;

    const result = await dispatch(
      verifyMfa({
        mfaToken: mfaSessionToken,
        code: totpCode.trim().toUpperCase(),
      })
    );

    if (!result.error) {
      navigate('/super-admin/dashboard');
    }
  };

  return (
    <div className="relative min-h-[88vh] flex items-center justify-center px-4 py-12 bg-slate-900/5 overflow-hidden">
      {/* Small Grid Box Pattern */}
      <div className="absolute inset-0 bg-grid-pattern radial-fade-mask opacity-75 pointer-events-none" />

      {/* Ambient Animated Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-700/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div
        className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"
        style={{ animationDelay: '2.5s' }}
      />

      {/* Floating Decorative Badges */}
      <div className="hidden lg:block absolute top-24 left-20 animate-float-slow pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-amber-400 border border-amber-400/30 text-xs font-bold shadow-lg">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Root Privilege Zone</span>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-24 right-20 animate-float-reverse pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-emerald-400 border border-emerald-400/30 text-xs font-bold shadow-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>RFC 6238 TOTP Active</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-300/80 rounded-3xl p-8 shadow-2xl shadow-blue-900/15 overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-amber-400 border border-slate-800 mb-3 shadow-md">
            {step === 'MFA_CHALLENGE' ? (
              <Smartphone className="w-7 h-7 text-amber-400" />
            ) : (
              <Crown className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2 border border-amber-400/20">
            Platform Security Tier 1
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 'MFA_CHALLENGE' ? 'Two-Factor Challenge' : 'FairKart Platform Administration'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'MFA_CHALLENGE'
              ? 'Enter the 6-digit TOTP code from your Authenticator app'
              : 'Root platform authorization & financial control center'}
          </p>
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

        <AnimatePresence mode="wait">
          {step === 'CREDENTIALS' ? (
            <motion.form
              key="credentials-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleCredentialsSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Super Admin Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@fairkart.dev"
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Root Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
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
                className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Need demo login?</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@fairkart.dev');
                    setPassword('Password@123');
                  }}
                  className="text-[11px] font-bold text-slate-900 hover:text-blue-700 hover:underline"
                >
                  Fill Demo (admin@fairkart.dev)
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="mfa-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleMfaSubmit}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {useRecoveryCode ? 'Backup Recovery Code' : 'MFA Verification Code'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseRecoveryCode(!useRecoveryCode);
                      setTotpCode('');
                      dispatch(clearAuthError());
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    {useRecoveryCode ? 'Use Authenticator Code' : 'Use Recovery Code'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={useRecoveryCode ? 10 : 6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.toUpperCase())}
                    placeholder={useRecoveryCode ? 'XXXXXXXX' : '123456'}
                    autoFocus
                    className="w-full bg-slate-50 text-center tracking-widest text-lg font-mono text-slate-900 rounded-xl px-4 py-3 border border-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                  {useRecoveryCode ? (
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  {useRecoveryCode
                    ? 'Enter one of your 8-character single-use emergency backup recovery codes.'
                    : 'Open Google Authenticator, Authy, or your RFC 6238 app.'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading || !totpCode.trim()}
                className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verify</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setStep('CREDENTIALS');
                  setTotpCode('');
                  dispatch(clearAuthError());
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors mt-2"
              >
                ← Back to Password Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-center">
          <p className="text-[11px] text-slate-400">
            Strict Root Security Enforced. All administrative events are permanently logged in tamper-evident audit ledgers.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
