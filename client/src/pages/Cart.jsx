import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { ShoppingBag, Coins, Trash2, ArrowRight, Tag, Loader2, X, Percent, LayoutDashboard, ArrowLeft, ShieldCheck, Flag, AlertCircle } from 'lucide-react';

export const Cart = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [coinsInput, setCoinsInput] = useState('');
  const [coinAlert, setCoinAlert] = useState('');
  const [maxCoinsPerPurchase, setMaxCoinsPerPurchase] = useState(100);
  const [coinsPerRupee, setCoinsPerRupee] = useState(10);
  const [selectedItemKeys, setSelectedItemKeys] = useState([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const getItemKey = (item) => `${item.productId?._id}-${item.variantSku || ''}`;

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      const cartData = res.data.data.cart;
      setCart(cartData);
      if (cartData?.coinsPerRupee) {
        setCoinsPerRupee(Number(cartData.coinsPerRupee));
      }
      if (cartData?.maxCoinsPerPurchase !== undefined) {
        setMaxCoinsPerPurchase(Number(cartData.maxCoinsPerPurchase));
      }
      if (cartData?.items) {
        setSelectedItemKeys(cartData.items.map((item) => getItemKey(item)));
      }
      if (cartData?.couponCode) {
        setCouponCode(cartData.couponCode);
        setCouponSuccess(`Coupon "${cartData.couponCode}" is active!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoins = (e) => {
    if (e) e.preventDefault();
    setCoinAlert('');
    const raw = String(coinsInput).trim();
    if (!raw) {
      setCoinsToUse(0);
      return;
    }
    const entered = Number(raw);
    if (isNaN(entered) || !Number.isInteger(entered) || entered < 0) {
      setCoinAlert('Please enter a valid non-negative whole number of Fair Coins.');
      return;
    }
    if (entered === 0) {
      setCoinsToUse(0);
      return;
    }
    if (entered > maxCoinsPerPurchase) {
      setCoinAlert(
        `You can use only ${maxCoinsPerPurchase} Fair Coins per purchase. Please reduce the amount and try again.`
      );
      return;
    }
    const currentBalance = Number(user?.fairCoinBalance) || 0;
    if (entered > currentBalance) {
      setCoinAlert(
        `You cannot redeem more than your available balance of ${currentBalance} Fair Coins.`
      );
      return;
    }
    setCoinsToUse(entered);
  };

  const handleRemoveCoins = () => {
    setCoinsToUse(0);
    setCoinsInput('');
    setCoinAlert('');
  };

  const handleUpdateQuantity = async (productId, quantity, variantSku = '') => {
    try {
      const res = await api.put('/cart/update', { productId, quantity, variantSku });
      const updatedCart = res.data.data.cart;
      setCart(updatedCart);
      if (updatedCart?.items) {
        const validKeys = updatedCart.items.map((item) => getItemKey(item));
        setSelectedItemKeys((prev) => prev.filter((k) => validKeys.includes(k)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectItem = (key) => {
    setSelectedItemKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (!cart || !cart.items) return;
    if (selectedItemKeys.length === cart.items.length) {
      setSelectedItemKeys([]);
    } else {
      setSelectedItemKeys(cart.items.map((item) => getItemKey(item)));
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/cart/apply-coupon', { code: couponCode });
      if (res.data?.success) {
        setCart(res.data.data.cart);
        setCouponSuccess(`Coupon "${couponCode}" applied successfully!`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.delete('/cart/coupon');
      if (res.data?.success) {
        setCart(res.data.data.cart);
        setCouponCode('');
        setCouponSuccess('Coupon removed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#ED1C2E] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Shopping Cart...</span>
      </div>
    );
  }

  // Calculate pricing based ONLY on selected items
  const selectedItems = cart?.items
    ? cart.items.filter((item) => selectedItemKeys.includes(getItemKey(item)))
    : [];

  const subtotal = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Pro-rated coupon discount for selected items
  const couponDiscount = cart?.couponDiscount && subtotal > 0
    ? (cart.couponDiscount * (subtotal / (cart.itemsTotal || 1)))
    : 0;

  const coinDiscount = coinsToUse > 0 ? (coinsToUse / coinsPerRupee) : 0;
  const total = Math.max(0, subtotal - couponDiscount - coinDiscount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen bg-[#FFFFFF]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-[#F7F7F9] hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">Shopping Cart</h1>
            <p className="text-xs text-slate-500">BAAPOO MART • BUY INDIAN • BUILD INDIA</p>
          </div>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#30358F] text-xs font-bold transition-all"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-[#222222]">Your shopping cart is empty</h2>
          <p className="text-xs text-slate-500">Explore authentic products from verified Indian merchants on BAAPOO MART.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-500/20 transition-all"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Master Select All Toolbar */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
              <label className="flex items-center gap-3 cursor-pointer select-none font-bold text-xs text-slate-800 hover:text-[#ED1C2E] transition-colors">
                <input
                  type="checkbox"
                  checked={cart.items.length > 0 && selectedItemKeys.length === cart.items.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#ED1C2E] focus:ring-[#ED1C2E] cursor-pointer accent-[#ED1C2E]"
                />
                <span>Select All ({selectedItemKeys.length} of {cart.items.length} items)</span>
              </label>

              {selectedItemKeys.length > 0 && (
                <span className="text-[11px] font-black text-[#30358F] bg-[#30358F]/10 border border-[#30358F]/20 px-3 py-1 rounded-full">
                  Selected Total: ₹{Number(subtotal).toFixed(2)}
                </span>
              )}
            </div>

            {cart.items.map((item) => {
              const itemKey = getItemKey(item);
              const isSelected = selectedItemKeys.includes(itemKey);

              return (
                <div
                  key={itemKey}
                  className={`bg-white border p-4 rounded-2xl flex items-center gap-4 shadow-2xs transition-all ${
                    isSelected ? 'border-[#ED1C2E]/40 ring-1 ring-[#ED1C2E]/10' : 'border-slate-200/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(itemKey)}
                    className="w-5 h-5 rounded border-slate-300 text-[#ED1C2E] focus:ring-[#ED1C2E] cursor-pointer accent-[#ED1C2E] shrink-0"
                    title={isSelected ? 'Deselect item' : 'Select item to buy'}
                  />

                  <img
                    src={item.productId?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.productId?.name}
                    className="w-16 h-16 object-contain rounded-xl bg-[#F7F7F9] shrink-0 border border-slate-200 p-1"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#222222] truncate">{item.productId?.name}</h4>
                    {item.variantSku && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">Option: {item.variantSku}</div>
                    )}
                    <div className="mt-1 flex flex-col">
                      {item.productId?.mrp && Number(item.productId.mrp) > Number(item.price) && (
                        <span className="text-[11px] text-slate-400 line-through font-medium leading-none mb-0.5">
                          ₹{Number(item.productId.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-xs font-black text-[#ED1C2E] leading-tight">
                        ₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-[#F7F7F9] border border-slate-200 rounded-lg p-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity - 1, item.variantSku)}
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 rounded transition-colors"
                    >
                      -
                    </button>
                    <span className="text-xs font-black text-slate-900 px-2">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId?._id, item.quantity + 1, item.variantSku)}
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 rounded transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleUpdateQuantity(item.productId?._id, 0, item.variantSku)}
                    className="p-2 text-slate-400 hover:text-[#ED1C2E] transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Summary Drawer & Code promotions */}
          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-6 shadow-xs h-fit">
            <h3 className="font-black text-base text-[#222222] border-b border-slate-100 pb-3">Order Summary</h3>

            {/* Coupon Code Panel */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#F7941D]" />
                <span>Promotional Coupon</span>
              </label>
              
              {cart.couponCode ? (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-3 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#F7941D]" />
                      <span>{cart.couponCode}</span>
                    </div>
                    <div className="text-[10px] text-orange-700 mt-0.5 font-bold">Applied (₹{Number(couponDiscount).toFixed(2)} saved)</div>
                  </div>
                  <button 
                    onClick={handleRemoveCoupon} 
                    disabled={applyingCoupon}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#F7F7F9] text-xs text-slate-800 uppercase rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-[#ED1C2E] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponCode}
                    className="px-4 py-2 bg-[#30358F] hover:bg-[#252972] text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && <p className="text-[10px] text-rose-600 font-bold">{couponError}</p>}
              {couponSuccess && !couponError && <p className="text-[10px] text-emerald-600 font-bold">{couponSuccess}</p>}
            </div>

            {/* Coins Redemption Box */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  Redeem Reward Coins
                </span>
                <span className="text-[11px] text-amber-700 font-bold">
                  Balance: {Number(user?.fairCoinBalance || 0).toLocaleString()} Coins
                </span>
              </div>

              <p className="text-xs text-amber-900 font-medium">
                You can use up to {maxCoinsPerPurchase} Fair Coins per purchase.
              </p>

              {coinAlert && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[#ED1C2E] text-xs font-bold flex items-start gap-1.5 shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ED1C2E]" />
                  <span>{coinAlert}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={coinsInput}
                  onChange={(e) => {
                    setCoinsInput(e.target.value);
                    setCoinAlert('');
                  }}
                  placeholder="Enter coins"
                  className="w-full bg-white text-xs text-slate-900 rounded-lg px-3 py-2 border border-amber-300 focus:outline-none focus:border-amber-500 font-bold"
                />
                <button
                  type="button"
                  onClick={handleApplyCoins}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shrink-0 transition-colors shadow-xs"
                >
                  Apply
                </button>
                {coinsToUse > 0 && (
                  <button
                    type="button"
                    onClick={handleRemoveCoins}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg shrink-0 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold pt-0.5">
                <span>{coinsPerRupee} Coins = ₹1 Discount</span>
                {coinsToUse > 0 && (
                  <span className="text-emerald-700">
                    Applied: {coinsToUse} coins (-₹{Number(coinDiscount).toFixed(2)})
                  </span>
                )}
              </div>
            </div>

            {/* Summary calculation log */}
            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal ({selectedItemKeys.length} item{selectedItemKeys.length !== 1 ? 's' : ''})</span>
                <span className="font-bold text-[#222222]">₹{Number(subtotal).toFixed(2)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#F7941D] font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{Number(couponDiscount).toFixed(2)}</span>
                </div>
              )}

              {coinDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Coins Discount</span>
                  <span>-₹{Number(coinDiscount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-emerald-700 font-bold">FREE DELIVERY</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm text-[#222222]">Grand Total</span>
              <span className="text-2xl font-black text-[#ED1C2E]">₹{Number(total).toFixed(2)}</span>
            </div>

            <button
              onClick={() => {
                if (selectedItemKeys.length === 0) return;
                navigate('/checkout', { state: { selectedItemKeys, coinsToUse, coinsPerRupee, maxCoinsPerPurchase } });
              }}
              disabled={selectedItemKeys.length === 0}
              className="w-full py-4 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>{selectedItemKeys.length > 0 ? `Proceed to Checkout (${selectedItemKeys.length} Items)` : 'Select Items to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
