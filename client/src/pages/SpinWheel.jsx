import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { updateCoinBalance, updateSuperCoins, fetchCurrentUser } from '../store/authSlice';
import { Coins, Award, Sparkles, Loader2, CheckCircle2, AlertCircle, Package, ArrowRight, X, Crown } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

export const SpinWheel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [wheelData, setWheelData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonReward, setWonReward] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const controls = useAnimation();

  useEffect(() => {
    fetchWheelConfig();
  }, []);

  const fetchWheelConfig = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/spin/wheel');
      setWheelData(res.data.data.wheel);
      setEligibility(res.data.data.eligibility);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.message || 'Failed to load Spin Wheel configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (spinning || !eligibility?.eligible) return;
    setSpinning(true);
    setWonReward(null);
    setShowPrizeModal(false);
    setErrorMsg('');

    try {
      const idempotencyKey = `spin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.post('/spin/spin', { idempotencyKey });
      const { winningSegmentIndex, reward, newCoinBalance, newSuperCoinBalance } = res.data.data;

      const rewardsCount = wheelData?.rewards?.length || 5;
      const segmentAngle = 360 / rewardsCount; // 72 deg per segment for 5 divisions
      
      // Calculate target angle to land top pointer right in center of winning segment
      const targetAngle = 360 * 6 + (360 - winningSegmentIndex * segmentAngle - segmentAngle / 2);

      await controls.start({
        rotate: targetAngle,
        transition: { duration: 4.5, ease: [0.15, 0.9, 0.2, 1] },
      });

      setWonReward(reward);
      setShowPrizeModal(true);

      setEligibility((prev) => ({
        ...prev,
        eligible: (prev?.spinsRemaining || 1) > 1,
        spinsRemaining: Math.max(0, (prev?.spinsRemaining || 1) - 1),
      }));

      if (newCoinBalance !== undefined) {
        dispatch(updateCoinBalance(newCoinBalance));
      }
      if (newSuperCoinBalance !== undefined) {
        dispatch(updateSuperCoins(newSuperCoinBalance));
      }
      if (newCoinBalance === undefined && newSuperCoinBalance === undefined) {
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Spin request failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Daily Spin Wheel...</span>
      </div>
    );
  }

  const rewards = wheelData?.rewards || [];
  const cost = wheelData?.coinsRequiredPerSpin || 0;
  const spinsLeft = eligibility?.spinsRemaining ?? 0;
  const isEligible = eligibility?.eligible ?? false;
  const isVip = Boolean(eligibility?.isPremium || user?.isVip || user?.isPremium || user?.role === 'SUPER_ADMIN');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-center">
      {/* Header Info */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>FairKart Daily Lucky Spin (5 Divisions)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {wheelData?.title || 'Daily FairKart Spin & Win'}
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          {wheelData?.description || 'Spin the 5-division wheel every day to win instant Fair Coins & Free Marketplace Products!'}
        </p>
      </div>

      {/* User Balance & Eligibility Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Fair Coins Balance</div>
          <div className="text-base font-black text-amber-600 flex items-center justify-center gap-1 mt-0.5">
            <Coins className="w-4 h-4" />
            {Number(user?.fairCoinBalance ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Account Status</div>
          <div className="text-base font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
            <Award className="w-4 h-4" />
            {isVip ? 'VIP Member' : 'Standard'}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Cost per Spin</div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {cost === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `${cost} FC`}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Spins Remaining</div>
          <div className={`text-base font-black mt-0.5 ${spinsLeft > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {spinsLeft}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 text-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wheel Canvas Container */}
      <div className="relative w-[340px] h-[340px] xs:w-[390px] xs:h-[390px] sm:w-[460px] sm:h-[460px] md:w-[500px] md:h-[500px] mx-auto flex items-center justify-center my-6">
        {/* Top Indicator Pointer (Luxury 3D Golden Teardrop Needle Pin) */}
        <div className="absolute -top-3 z-30 filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.65)] pointer-events-none">
          <svg width="46" height="54" viewBox="0 0 46 54" fill="none">
            <path
              d="M 23 52 L 6 14 A 17 17 0 0 1 40 14 Z"
              fill="url(#pointerGoldGrad)"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Center Ruby Jewel Accent */}
            <circle cx="23" cy="18" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
            <circle cx="21" cy="15.5" r="2.5" fill="#ffffff" opacity="0.85" />
          </svg>
        </div>

        {/* Animated 5-Division SVG Wheel */}
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.18)] relative overflow-hidden bg-white border-4 border-white"
        >
          <svg viewBox="0 0 500 500" className="w-full h-full select-none">
            <defs>
              {/* Outer Golden Gradient */}
              <linearGradient id="pointerGoldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* Text Shadow for Crisp Contrast */}
              <filter id="wheelTextShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
              </filter>

              {/* Dynamic Slices ClipPaths so text NEVER bleeds outside division */}
              {rewards.map((_, i) => {
                const count = rewards.length || 5;
                const segAngle = 360 / count;
                const startA = i * segAngle;
                const endA = (i + 1) * segAngle;
                const R = 250;
                const sx1 = 250 + R * Math.sin((startA * Math.PI) / 180);
                const sy1 = 250 - R * Math.cos((startA * Math.PI) / 180);
                const sx2 = 250 + R * Math.sin((endA * Math.PI) / 180);
                const sy2 = 250 - R * Math.cos((endA * Math.PI) / 180);
                const d = `M 250 250 L ${sx1.toFixed(2)} ${sy1.toFixed(2)} A ${R} ${R} 0 0 1 ${sx2.toFixed(2)} ${sy2.toFixed(2)} Z`;

                return (
                  <clipPath id={`slice-clip-${i}`} key={`clip-${i}`}>
                    <path d={d} />
                  </clipPath>
                );
              })}
            </defs>

            {/* Slices Rendering with Embedded Radial Labels & Icons */}
            {rewards.map((reward, i) => {
              const count = rewards.length || 5;
              const segAngle = 360 / count;
              const startA = i * segAngle;
              const endA = (i + 1) * segAngle;
              const midA = (i + 0.5) * segAngle;
              const R = 250;

              const sx1 = 250 + R * Math.sin((startA * Math.PI) / 180);
              const sy1 = 250 - R * Math.cos((startA * Math.PI) / 180);
              const sx2 = 250 + R * Math.sin((endA * Math.PI) / 180);
              const sy2 = 250 - R * Math.cos((endA * Math.PI) / 180);
              const slicePath = `M 250 250 L ${sx1.toFixed(2)} ${sy1.toFixed(2)} A ${R} ${R} 0 0 1 ${sx2.toFixed(2)} ${sy2.toFixed(2)} Z`;

              // Modern vibrant slice color palette fallback
              const PALETTE = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];
              const sliceColor = reward.color || PALETTE[i % PALETTE.length];

              // Parse title and subtext to ensure clean containment
              const isProduct = reward.type === 'PRODUCT';
              const rawTitle = (reward.title || reward.productTitle || '').trim();
              const upperTitle = rawTitle.toUpperCase();

              let line1 = '';
              let line2 = '';
              let iconType = 'coin';

              if (isProduct) {
                line1 = 'FREE';
                line2 = rawTitle.length > 12 ? rawTitle.slice(0, 11) + '…' : rawTitle;
                iconType = 'product';
              } else if (upperTitle.includes('TRY') || upperTitle.includes('AGAIN')) {
                line1 = 'TRY';
                line2 = 'AGAIN';
                iconType = 'retry';
              } else {
                const numMatch = rawTitle.match(/\d+/);
                const val = reward.value || (numMatch ? numMatch[0] : '');
                if (val) {
                  line1 = `${val}`;
                  line2 = 'FAIR COINS';
                  iconType = 'coin';
                } else {
                  const parts = rawTitle.split(' ');
                  line1 = parts[0] || 'REWARD';
                  line2 = parts.slice(1).join(' ') || '';
                  iconType = 'coin';
                }
              }

              return (
                <g key={i}>
                  {/* Sector Background Slice with crisp white divider */}
                  <path
                    d={slicePath}
                    fill={sliceColor}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />

                  {/* Division Content strictly clipped to this slice so letters NEVER cross boundary */}
                  <g clipPath={`url(#slice-clip-${i})`}>
                    <g transform={`rotate(${midA} 250 250)`}>
                      {/* Reward Badge / Icon strictly inside the division */}
                      {iconType === 'product' && (
                        <g transform="translate(250, 56)">
                          <rect x="-11" y="-9" width="22" height="18" rx="2.5" fill="#34d399" stroke="#065f46" strokeWidth="1.5" />
                          <rect x="-13" y="-12" width="26" height="5.5" rx="1.5" fill="#6ee7b7" stroke="#065f46" strokeWidth="1" />
                          <line x1="0" y1="-12" x2="0" y2="9" stroke="#ffffff" strokeWidth="2.5" />
                          <line x1="-11" y1="0" x2="11" y2="0" stroke="#ffffff" strokeWidth="2.5" />
                        </g>
                      )}

                      {iconType === 'retry' && (
                        <g transform="translate(250, 56)">
                          <circle cx="0" cy="0" r="12" fill="rgba(255,255,255,0.25)" stroke="#ffffff" strokeWidth="1" />
                          <path d="M 0 -8 L 2.5 -2.5 L 8 0 L 2.5 2.5 L 0 8 L -2.5 2.5 L -8 0 L -2.5 -2.5 Z" fill="#ffffff" />
                        </g>
                      )}

                      {iconType === 'coin' && (
                        <g transform="translate(250, 56)">
                          <circle cx="0" cy="0" r="13" fill="#fef08a" stroke="#b45309" strokeWidth="2" />
                          <circle cx="0" cy="0" r="10" fill="#f59e0b" />
                          <text x="0" y="3.5" textAnchor="middle" fill="#78350f" fontSize="9.5" fontWeight="900">FC</text>
                        </g>
                      )}

                      {/* Main Value Line (Bold & Large) */}
                      <text
                        x="250"
                        y="92"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={line1.length > 5 ? '17' : '22'}
                        fontWeight="900"
                        letterSpacing="0.5"
                        filter="url(#wheelTextShadow)"
                        className="select-none pointer-events-none"
                      >
                        {line1}
                      </text>

                      {/* Subtitle / Unit Line (Contained within wedge) */}
                      {line2 && (
                        <text
                          x="250"
                          y="112"
                          textAnchor="middle"
                          fill="rgba(255, 255, 255, 0.95)"
                          fontSize={line2.length > 10 ? '9.5' : '11'}
                          fontWeight="800"
                          letterSpacing="0.8"
                          filter="url(#wheelTextShadow)"
                          className="select-none pointer-events-none uppercase"
                        >
                          {line2}
                        </text>
                      )}
                    </g>
                  </g>
                </g>
              );
            })}

            {/* Clean Outer Wheel Rim Border (No Black Ring) */}
            <circle cx="250" cy="250" r="248" fill="none" stroke="#ffffff" strokeWidth="3" />
          </svg>
        </motion.div>

        {/* Center Spin Button (Opaque Circular Core Pin) */}
        <button
          onClick={handleSpin}
          disabled={spinning || !isEligible}
          style={{ backgroundColor: '#0f172a' }}
          className="absolute z-20 w-28 h-28 sm:w-32 sm:h-32 rounded-full hover:scale-105 active:scale-95 text-white font-black shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center border-4 border-amber-400 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
        >
          {spinning ? (
            <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          ) : (
            <>
              <span className="text-amber-400 tracking-wider text-xl font-black drop-shadow-sm">SPIN</span>
              <span className="text-[11px] font-bold text-slate-300 mt-0.5">
                {cost === 0 ? 'FREE' : `${cost} FC`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Won Reward Banner */}
      {wonReward && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-300 p-5 rounded-3xl max-w-lg mx-auto flex items-center justify-between gap-4 text-amber-950 font-bold text-sm shadow-md"
        >
          <div className="flex items-center gap-3 text-left">
            {wonReward.type === 'PRODUCT' ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-emerald-700" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-amber-600 animate-bounce" />
              </div>
            )}
            <div>
              <div className="font-black text-base text-slate-900">Congratulations!</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                {wonReward.type === 'PRODUCT'
                  ? `You won a free Product: ${wonReward.productTitle || wonReward.title}`
                  : `You won ${wonReward.title}!`}
              </div>
            </div>
          </div>
          {wonReward.type === 'PRODUCT' && (
            <Link
              to="/products"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 transition"
            >
              <span>View Product</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </motion.div>
      )}

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {showPrizeModal && wonReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
            >
              <button
                onClick={() => setShowPrizeModal(false)}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border-4 border-amber-200 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-1">Congratulations!</h2>
              <p className="text-xs text-slate-500 mb-5">You landed on the spin wheel reward!</p>

              {wonReward.type === 'PRODUCT' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-center space-y-3">
                  {wonReward.productImage && (
                    <img
                      src={wonReward.productImage}
                      alt={wonReward.productTitle}
                      className="w-24 h-24 object-cover rounded-xl mx-auto shadow-sm border border-emerald-200"
                    />
                  )}
                  <div>
                    <div className="text-xs font-extrabold uppercase text-emerald-700 tracking-wider">Product Won</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {wonReward.productTitle || wonReward.title}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center space-y-2">
                  <Coins className="w-10 h-10 text-amber-500 mx-auto" />
                  <div className="text-2xl font-black text-amber-600">{wonReward.title}</div>
                  <p className="text-xs font-semibold text-amber-800">
                    {wonReward.value} Fair Coins have been credited directly to your FairKart Wallet!
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowPrizeModal(false)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl shadow-md text-sm transition"
              >
                Claim & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Membership Status & Upgrade Callout */}
      {!eligibility?.isPremium && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Regular Customer: 1 Free Spin Per Month</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Regular accounts receive 1 spin per month. Upgrade to VIP Pass Premium to unlock <strong className="text-slate-900 font-extrabold">Daily Spins</strong>!
            </p>
          </div>
          <Link
            to="/customer/subscription"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex-shrink-0 flex items-center gap-1 transition"
          >
            <span>Upgrade to VIP</span>
            <Crown className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Eligibility status text */}
      <div className="text-xs">
        {isEligible ? (
          <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {eligibility?.isPremium ? 'VIP Pass Active: Daily Spin Available Today!' : 'Regular Member: 1 Monthly Free Spin Available!'}
          </span>
        ) : (
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 font-semibold">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>
                {eligibility?.isPremium
                  ? 'Daily Spin Limit Reached. Come back tomorrow for your next VIP spin!'
                  : 'Monthly Spin Limit Reached: Regular accounts get 1 spin per month.'}
              </span>
            </div>
            {!eligibility?.isPremium && (
              <Link
                to="/customer/subscription"
                className="text-amber-700 font-extrabold text-xs underline hover:text-amber-800"
              >
                Upgrade to VIP for Daily Spins →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
