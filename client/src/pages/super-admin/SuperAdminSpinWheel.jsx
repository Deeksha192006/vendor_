import React, { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import {
  Dices,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
  Package,
  Sparkles,
  Sliders,
  Eye,
  RefreshCw,
} from 'lucide-react';

const PRESET_COLORS = [
  '#eab308', // Amber gold
  '#ca8a04', // Dark gold
  '#fde047', // Yellow
  '#15803d', // Dark Emerald
  '#166534', // Deep Green
  '#2563eb', // Royal Blue
  '#7c3aed', // Purple
  '#ec4899', // Pink
  '#e11d48', // Red
  '#0f172a', // Dark Slate
];

export const SuperAdminSpinWheel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  
  // Wheel State
  const [title, setTitle] = useState('Daily FairKart Spin & Win');
  const [description, setDescription] = useState('Spin the wheel every day to win instant Fair Coins & Exclusive Products!');
  const [isActive, setIsActive] = useState(true);
  const [dailySpinsPerUser, setDailySpinsPerUser] = useState(1);
  const [coinsRequiredPerSpin, setCoinsRequiredPerSpin] = useState(0);

  // 5 Segments State: Exactly 3 Fair Coins + 2 Products
  const [rewards, setRewards] = useState([
    {
      title: '100 FAIR COINS',
      type: 'FAIR_COINS',
      value: 100,
      productId: '',
      productTitle: '',
      productImage: '',
      probability: 25,
      color: '#eab308',
    },
    {
      title: '200 FAIR COINS',
      type: 'FAIR_COINS',
      value: 200,
      productId: '',
      productTitle: '',
      productImage: '',
      probability: 20,
      color: '#ca8a04',
    },
    {
      title: '500 FAIR COINS',
      type: 'FAIR_COINS',
      value: 500,
      productId: '',
      productTitle: '',
      productImage: '',
      probability: 15,
      color: '#fde047',
    },
    {
      title: 'Wireless Headphones',
      type: 'PRODUCT',
      value: 0,
      productId: '',
      productTitle: 'Wireless Headphones',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
      probability: 20,
      color: '#15803d',
    },
    {
      title: 'Smart Watch',
      type: 'PRODUCT',
      value: 0,
      productId: '',
      productTitle: 'Smart Watch',
      productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
      probability: 20,
      color: '#166534',
    },
  ]);

  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchWheelConfig();
  }, []);

  const fetchWheelConfig = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await superAdminService.getSpinWheelConfig();
      if (data?.wheel) {
        setTitle(data.wheel.title || 'Daily FairKart Spin & Win');
        setDescription(data.wheel.description || '');
        setIsActive(data.wheel.isActive !== false);
        setDailySpinsPerUser(data.wheel.dailySpinsPerUser || 1);
        setCoinsRequiredPerSpin(data.wheel.coinsRequiredPerSpin || 0);

        if (data.wheel.rewards && data.wheel.rewards.length === 5) {
          setRewards(data.wheel.rewards);
        }
      }
      if (data?.availableProducts) {
        setAvailableProducts(data.availableProducts);
      }
    } catch (err) {
      console.error('Failed to load wheel config:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load Spin Wheel configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleRewardChange = (index, field, val) => {
    setRewards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };

      // If linking a product from dropdown
      if (field === 'productId' && val) {
        const selProd = availableProducts.find((p) => p._id === val);
        if (selProd) {
          copy[index].productTitle = selProd.name;
          copy[index].title = selProd.name;
          copy[index].productImage = selProd.images?.[0] || copy[index].productImage;
        }
      }

      // Auto update title for coin rewards if value changed
      if (field === 'value' && copy[index].type === 'FAIR_COINS') {
        copy[index].title = `${val} FAIR COINS`;
      }

      return copy;
    });
  };

  const totalProbability = rewards.reduce((sum, r) => sum + (Number(r.probability) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    setToastMessage(null);

    // Validate 5 rewards rule
    if (rewards.length !== 5) {
      setErrorMessage('The Spin Wheel must consist of EXACTLY 5 divisions.');
      setSaving(false);
      return;
    }

    const fairCoinCount = rewards.filter((r) => r.type === 'FAIR_COINS').length;
    const productCount = rewards.filter((r) => r.type === 'PRODUCT').length;

    if (fairCoinCount !== 3 || productCount !== 2) {
      setErrorMessage(
        `Spin Wheel must consist of 3 Fair Coins slots and 2 Product slots. Current count: ${fairCoinCount} Fair Coins, ${productCount} Products.`
      );
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title,
        description,
        dailySpinsPerUser: Number(dailySpinsPerUser),
        coinsRequiredPerSpin: Number(coinsRequiredPerSpin),
        isActive,
        rewards,
      };

      await superAdminService.updateSpinWheelConfig(payload);
      setToastMessage('Spin Wheel configuration updated successfully! Customer side updated in real-time.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Failed to save Spin Wheel configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading Spin Wheel Control Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <Dices className="w-96 h-96 text-amber-400" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super Admin Command Feature</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Spin & Win Wheel Control Center
          </h1>
          <p className="text-sm text-amber-100/80 leading-relaxed">
            Configure the customer Spin & Win wheel. Per requirements, the wheel is strictly constrained to{' '}
            <strong className="text-amber-300">5 Divisions</strong> (3 Fair Coins + 2 Products). All updates instantly sync to the live store.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 text-sm font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs text-emerald-700 underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-900 text-sm font-bold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Settings & Segments | Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Config Panel (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Global Parameters Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Global Spin Parameters</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2.5 text-xs font-extrabold text-slate-700">
                  {isActive ? 'ACTIVE' : 'DISABLED'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wheel Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Daily Free Spins Per Customer</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={dailySpinsPerUser}
                  onChange={(e) => setDailySpinsPerUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cost Per Spin (Fair Coins)</label>
                <input
                  type="number"
                  min="0"
                  value={coinsRequiredPerSpin}
                  onChange={(e) => setCoinsRequiredPerSpin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 5 Divisions Segment Editor */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Dices className="w-5 h-5 text-amber-500" />
                  <span>Configure 5 Divisions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exactly 3 Fair Coins segments + 2 Product segments required.
                </p>
              </div>

              {/* Total Probability Badge */}
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                  totalProbability === 100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <span>Weight Total: {totalProbability}%</span>
                {totalProbability !== 100 && <AlertCircle className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Segments List */}
            <div className="space-y-4">
              {rewards.map((reward, idx) => {
                const isCoin = reward.type === 'FAIR_COINS';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCoin ? 'bg-amber-50/40 border-amber-200' : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isCoin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCoin ? 'Fair Coins Segment' : 'Product Segment'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Color:</span>
                        <div className="flex items-center gap-1">
                          {PRESET_COLORS.slice(0, 5).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleRewardChange(idx, 'color', c)}
                              style={{ backgroundColor: c }}
                              className={`w-5 h-5 rounded-full border border-white shadow-xs transition transform hover:scale-110 ${
                                reward.color === c ? 'ring-2 ring-slate-900 scale-110' : ''
                              }`}
                            />
                          ))}
                          <input
                            type="color"
                            value={reward.color || '#eab308'}
                            onChange={(e) => handleRewardChange(idx, 'color', e.target.value)}
                            className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {isCoin ? (
                        <>
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Coin Amount</label>
                            <div className="relative">
                              <Coins className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                              <input
                                type="number"
                                min="1"
                                value={reward.value || 100}
                                onChange={(e) => handleRewardChange(idx, 'value', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Segment Label</label>
                            <input
                              type="text"
                              value={reward.title}
                              onChange={(e) => handleRewardChange(idx, 'title', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Marketplace Product</label>
                            <select
                              value={reward.productId || ''}
                              onChange={(e) => handleRewardChange(idx, 'productId', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">-- Choose Product --</option>
                              {availableProducts.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} (₹{p.price})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Label</label>
                            <input
                              type="text"
                              value={reward.productTitle || reward.title}
                              onChange={(e) => {
                                handleRewardChange(idx, 'productTitle', e.target.value);
                                handleRewardChange(idx, 'title', e.target.value);
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </>
                      )}

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Win Weight (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={reward.probability}
                          onChange={(e) => handleRewardChange(idx, 'probability', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Action Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={fetchWheelConfig}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-md hover:shadow-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Spin Wheel Configuration</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive 5-Division Wheel Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs text-center space-y-4 sticky top-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Eye className="w-4 h-4" />
              <span>Real-Time Live Wheel Preview</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">{title || 'Daily Spin & Win'}</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">{description}</p>

            {/* SVG 5-Segment Wheel Render */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto flex items-center justify-center py-4">
              {/* Pointer Teardrop Pin / Triangle */}
              <div className="absolute -top-2 z-30 filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)] pointer-events-none">
                <svg width="36" height="42" viewBox="0 0 46 54" fill="none">
                  <path
                    d="M 23 52 L 6 14 A 17 17 0 0 1 40 14 Z"
                    fill="#f59e0b"
                    stroke="#b45309"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="23" cy="18" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="21" cy="15.5" r="2.5" fill="#ffffff" opacity="0.85" />
                </svg>
              </div>

              <div className="w-full h-full rounded-full shadow-2xl relative overflow-hidden bg-white border-4 border-white">
                <svg viewBox="0 0 500 500" className="w-full h-full select-none">
                  <defs>
                    <filter id="adminWheelTextShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
                    </filter>
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
                        <clipPath id={`admin-slice-clip-${i}`} key={`admin-clip-${i}`}>
                          <path d={d} />
                        </clipPath>
                      );
                    })}
                  </defs>

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

                    const PALETTE = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];
                    const sliceColor = reward.color || PALETTE[i % PALETTE.length];

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
                        <path
                          d={slicePath}
                          fill={sliceColor}
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                        <g clipPath={`url(#admin-slice-clip-${i})`}>
                          <g transform={`rotate(${midA} 250 250)`}>
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

                            <text
                              x="250"
                              y="92"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize={line1.length > 5 ? '17' : '22'}
                              fontWeight="900"
                              letterSpacing="0.5"
                              filter="url(#adminWheelTextShadow)"
                              className="select-none pointer-events-none"
                            >
                              {line1}
                            </text>

                            {line2 && (
                              <text
                                x="250"
                                y="112"
                                textAnchor="middle"
                                fill="rgba(255, 255, 255, 0.95)"
                                fontSize={line2.length > 10 ? '9.5' : '11'}
                                fontWeight="800"
                                letterSpacing="0.8"
                                filter="url(#adminWheelTextShadow)"
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
              </div>

              {/* Center Teardrop / Spin Pin */}
              <div
                style={{ backgroundColor: '#0f172a' }}
                className="absolute z-20 w-20 h-20 rounded-full text-white font-black text-xs shadow-xl flex flex-col items-center justify-center border-4 border-amber-400"
              >
                <div className="text-xs font-black tracking-wider text-amber-400">SPIN</div>
              </div>
            </div>

            {/* Division Legend Table */}
            <div className="pt-4 border-t border-slate-100 text-left space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                Current 5 Divisions Summary
              </span>
              <div className="space-y-1.5">
                {rewards.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {r.title || r.productTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {r.type === 'FAIR_COINS' ? 'COINS' : 'PRODUCT'}
                      </span>
                      <span className="font-black text-slate-900">{r.probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSpinWheel;
