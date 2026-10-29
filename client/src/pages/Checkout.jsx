import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import api from '../services/api';
import { updateCoinBalance } from '../store/authSlice';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  MapPin,
  Plus,
  ShoppingBag,
  Coins,
  Tag,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const initialCoins = Number(location.state?.coinsToUse) || 0;
  const [coinsToUse, setCoinsToUse] = useState(initialCoins);
  const [coinsInput, setCoinsInput] = useState(initialCoins ? String(initialCoins) : '');
  const [availableCoins, setAvailableCoins] = useState(Number(user?.fairCoinBalance) || 0);
  const [maxCoinsPerPurchase, setMaxCoinsPerPurchase] = useState(100);
  const [coinAlert, setCoinAlert] = useState('');
  const selectedItemKeys = location.state?.selectedItemKeys || null;

  // Cart & Pricing State
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);

  // Filter items selected by user from Cart
  const checkoutItems = React.useMemo(() => {
    if (!cart || !cart.items) return [];
    if (!selectedItemKeys || !Array.isArray(selectedItemKeys) || selectedItemKeys.length === 0) {
      return cart.items;
    }
    return cart.items.filter((item) => {
      const pId = item.productId?._id ? item.productId._id.toString() : item.productId?.toString();
      const key = `${pId}-${item.variantSku || ''}`;
      return selectedItemKeys.includes(key) || selectedItemKeys.includes(pId);
    });
  }, [cart, selectedItemKeys]);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockPaymentData, setMockPaymentData] = useState(null);

  useEffect(() => {
    fetchCartAndAddresses();
  }, []);

  const fetchCartAndAddresses = async () => {
    setCartLoading(true);
    try {
      const [cartRes, addrRes, walletRes] = await Promise.all([
        api.get('/cart').catch(() => ({ data: { data: { cart: null } } })),
        api.get('/users/me/addresses').catch(() => ({ data: { data: [] } })),
        api.get('/fair-coins/wallet').catch(() => ({ data: { data: { wallet: null } } })),
      ]);

      const cartData = cartRes.data?.data?.cart;
      setCart(cartData);

      const walletData = walletRes.data?.data?.wallet;
      if (walletData) {
        setAvailableCoins(Number(walletData.balance) || 0);
        if (walletData.maxCoinsPerPurchase !== undefined) {
          setMaxCoinsPerPurchase(Number(walletData.maxCoinsPerPurchase));
        }
      } else if (cartData?.maxCoinsPerPurchase !== undefined) {
        setMaxCoinsPerPurchase(Number(cartData.maxCoinsPerPurchase));
      }

      const addrs = addrRes.data?.data || [];
      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        setSelectedAddressId(def._id);
        setAddress({
          name: def.name,
          phone: def.phone,
          street: def.streetAddress,
          city: def.city,
          state: def.state,
          zip: def.postalCode,
        });
      } else {
        setUseNewAddress(true);
      }
    } catch (e) {
      console.error('Checkout fetch error:', e);
    } finally {
      setCartLoading(false);
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

    const currentBalance = availableCoins || user?.fairCoinBalance || 0;
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

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setUseNewAddress(false);
    setAddress({
      name: addr.name,
      phone: addr.phone,
      street: addr.streetAddress,
      city: addr.city,
      state: addr.state,
      zip: addr.postalCode,
    });
  };

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleVerifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    setCheckoutStep('verifying_payment');
    try {
      await api.post('/payments/verify', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      // Refresh coins if any used or rewarded
      api.get('/auth/me').then((res) => {
        if (res.data?.data?.user?.fairCoinBalance !== undefined) {
          dispatch(updateCoinBalance(res.data.data.user.fairCoinBalance));
        }
      });

      alert('Payment verified and order placed successfully.');
      navigate('/account/orders');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Payment verification failed');
      setSubmitting(false);
      setCheckoutStep('idle');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (coinsToUse > maxCoinsPerPurchase) {
      setErrorMessage(
        `You can use only ${maxCoinsPerPurchase} Fair Coins per purchase. Please reduce the amount and try again.`
      );
      return;
    }

    setSubmitting(true);
    setCheckoutStep('creating_order');

    try {
      const orderPayload = {
        paymentMethod,
        fairCoinsToRedeem: coinsToUse,
        selectedItemKeys: selectedItemKeys || checkoutItems.map((i) => `${i.productId?._id}-${i.variantSku || ''}`),
      };

      if (!useNewAddress && selectedAddressId) {
        orderPayload.shippingAddressId = selectedAddressId;
      } else {
        orderPayload.shippingAddress = {
          name: address.name,
          phone: address.phone,
          streetAddress: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.zip,
          country: 'India',
        };
      }

      const res = await api.post('/orders', orderPayload);
      const order = res.data.data.order;

      if (paymentMethod === 'COD') {
        alert(`Order #${order.orderNumber} placed successfully via Cash on Delivery!`);
        navigate('/account/orders');
        return;
      }

      setCheckoutStep('opening_payment');
      const paymentRes = await api.post('/payments/create-order', {
        orderId: order._id,
      });

      const paymentData = paymentRes.data.data;
      const isMock = paymentData.razorpayOrderId?.startsWith('order_mock_') || paymentData.keyId === 'rzp_test_demo';
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || isMock) {
        setMockPaymentData({
          order,
          paymentData,
        });
        setShowMockModal(true);
        setSubmitting(false);
        setCheckoutStep('idle');
        return;
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'FairKart Marketplace',
        description: `Payment for Order #${order.orderNumber}`,
        order_id: paymentData.razorpayOrderId,
        handler: async function (response) {
          await handleVerifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setErrorMessage('Payment process was cancelled. You can complete payment from My Orders.');
            setSubmitting(false);
            setCheckoutStep('idle');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMessage(`Payment Failed: ${resp.error?.description || 'Gateway transaction failed'}`);
        setSubmitting(false);
        setCheckoutStep('idle');
      });
      rzp.open();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to initiate checkout process');
      setSubmitting(false);
      setCheckoutStep('idle');
    }
  };

  const calculateSubtotal = () => {
    if (!checkoutItems || checkoutItems.length === 0) return 0;
    return checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const coinsPerRupee = location.state?.coinsPerRupee || cart?.coinsPerRupee || 10;
  const subtotal = calculateSubtotal();
  const couponDiscount = cart?.discountAmount || 0;
  const coinDiscount = Math.floor(coinsToUse / (coinsPerRupee || 10));
  const grandTotal = Math.max(0, subtotal - couponDiscount - coinDiscount);

  if (cartLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-600 text-sm font-medium">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-600">Please add items to your cart before proceeding to checkout.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FFFFFF] min-h-screen"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#30358F]/10 border border-[#30358F]/20 text-[#30358F] text-xs font-black uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ED1C2E]" />
          <span>BAAPOO MART • 256-Bit SSL Encrypted Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">Checkout & Payment</h1>
        <p className="text-sm text-slate-600 mt-1">Review your delivery address, items, and select payment method</p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-[#ED1C2E] p-4 rounded-2xl text-sm font-bold shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#ED1C2E]" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Address & Payment Gateway Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Delivery Address */}
          <div className="bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-black text-base text-[#222222] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#30358F]" />
                <span>1. Delivery Address</span>
              </h3>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                  className="text-xs sm:text-sm text-[#30358F] font-bold hover:underline"
                >
                  {useNewAddress ? 'Select Saved Address' : '+ Enter New Address'}
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!useNewAddress && savedAddresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/20 text-slate-900'
                          : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900">{addr.name}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{addr.streetAddress}</p>
                      <p className="text-xs text-slate-700 font-medium mt-1">
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Phone: {addr.phone}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* New Address Inputs */
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Recipient Full Name"
                    value={address.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Phone Number (10 digits)"
                    value={address.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                </div>
                <input
                  type="text"
                  name="street"
                  required
                  placeholder="Street Address / House No / Area"
                  value={address.street}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                />
                <div className="grid grid-cols-3 gap-3.5">
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="City"
                    value={address.city}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <input
                    type="text"
                    name="state"
                    required
                    placeholder="State"
                    value={address.state}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                  <input
                    type="text"
                    name="zip"
                    required
                    placeholder="PIN Code"
                    value={address.zip}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="bg-white border border-slate-200/80 p-6 sm:p-7 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <span>2. Select Payment Method</span>
            </h3>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'bg-red-50/60 border-[#ED1C2E] ring-2 ring-[#ED1C2E]/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'RAZORPAY' ? 'border-[#ED1C2E]' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'RAZORPAY' && <div className="w-2.5 h-2.5 rounded-full bg-[#ED1C2E]" />}
                  </div>
                  <div>
                    <span className="text-sm font-black block text-[#222222]">Razorpay Online Payment</span>
                    <span className="text-xs text-slate-500">UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking</span>
                  </div>
                </div>
                <span className="text-xs font-black bg-red-100 text-[#ED1C2E] border border-red-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Instant
                </span>
              </label>

              <label
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-red-50/60 border-[#ED1C2E] ring-2 ring-[#ED1C2E]/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'COD' ? 'border-[#ED1C2E]' : 'border-slate-300'
                    }`}
                  >
                    {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-[#ED1C2E]" />}
                  </div>
                  <div>
                    <span className="text-sm font-black block text-[#222222]">Cash on Delivery (COD)</span>
                    <span className="text-xs text-slate-500">Pay cash upon parcel delivery at your doorstep</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Order Review & Total Summary */}
        <div className="bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-xs space-y-6 sticky top-24">
          <h3 className="font-black text-base text-[#222222] border-b border-slate-100 pb-4">Order Summary</h3>

          {/* Item Thumbnails & Quantities */}
          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {checkoutItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <img
                  src={item.productId?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                  alt={item.productId?.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#222222] truncate">{item.productId?.name}</p>
                  <div className="text-slate-500 text-xs">
                    {item.productId?.mrp && Number(item.productId.mrp) > Number(item.price) && (
                      <span className="text-slate-400 line-through block text-[11px] leading-none mb-0.5">
                        MRP: ₹{Number(item.productId.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <span>Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <span className="font-black text-[#222222]">₹{Number(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          {/* Fair Coins Redemption Section */}
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                Fair Coins Redemption
              </span>
              <span className="text-[11px] text-amber-800 font-bold">
                Balance: {Number(availableCoins || user?.fairCoinBalance || 0).toLocaleString()} Coins
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
                placeholder="Enter Fair Coins"
                value={coinsInput}
                onChange={(e) => {
                  setCoinsInput(e.target.value);
                  setCoinAlert('');
                }}
                className="w-full bg-white text-xs text-slate-900 rounded-xl px-3 py-2 border border-amber-300 focus:outline-none focus:border-amber-500 font-bold"
              />
              <button
                type="button"
                onClick={handleApplyCoins}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
              >
                Apply
              </button>
              {coinsToUse > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveCoins}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs shrink-0 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold pt-0.5">
              <span>{coinsPerRupee} Fair Coins = ₹1</span>
              {coinsToUse > 0 && (
                <span className="text-emerald-700">
                  Applied: {coinsToUse} coins (-₹{coinDiscount.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-[#222222]">₹{subtotal.toFixed(2)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-[#F7941D] font-bold">
                <span>Coupon ({cart.couponCode})</span>
                <span>-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}

            {coinDiscount > 0 && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>Fair Coins ({coinsToUse} coins)</span>
                <span>-₹{coinDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery / Shipping</span>
              <span className="text-emerald-700 font-bold">FREE DELIVERY</span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
              <span className="font-black text-base text-[#222222]">Grand Total</span>
              <span className="text-2xl font-black text-[#ED1C2E]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {checkoutStep === 'creating_order' && 'Creating Order...'}
                  {checkoutStep === 'opening_payment' && 'Opening Gateway...'}
                  {checkoutStep === 'verifying_payment' && 'Verifying Payment...'}
                  {checkoutStep === 'idle' && 'Processing...'}
                </span>
              </div>
            ) : (
              <>
                <span>Pay ₹{grandTotal.toFixed(2)} & Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Mock Development Razorpay Modal */}
      {showMockModal && mockPaymentData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 sm:p-7 rounded-3xl w-full max-w-md space-y-5 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">
                ₹
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Razorpay Test Gateway (Sandbox)</h3>
                <p className="text-xs text-slate-500">Simulate test payment for Order #{mockPaymentData.order?.orderNumber}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-sm border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="font-extrabold text-slate-900">₹{(mockPaymentData.paymentData?.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Test Order ID:</span>
                <span className="font-mono text-slate-800 text-xs">{mockPaymentData.paymentData?.razorpayOrderId}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowMockModal(false);
                  setErrorMessage('Payment cancelled by user.');
                }}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel / Fail
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowMockModal(false);
                  await handleVerifyPayment({
                    razorpayOrderId: mockPaymentData.paymentData?.razorpayOrderId,
                    razorpayPaymentId: `pay_mock_${Date.now()}`,
                    razorpaySignature: `mock_signature_test_${Date.now()}`,
                  });
                }}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                Simulate Payment Success
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
