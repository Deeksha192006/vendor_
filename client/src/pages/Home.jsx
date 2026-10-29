import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  ShoppingBag,
  Coins,
  Dices,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Crown,
  Copy,
  Check,
  Heart,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Sparkle,
  Watch,
  Headphones as HeadphonesIcon,
  Flame,
  Zap,
  Store,
  QrCode,
  Receipt,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Layers,
  Award,
  BadgeCheck,
  Gift,
  CheckCircle,
  Flag
} from 'lucide-react';
import { motion } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import ProductCard from '../components/ProductCard';

const CATEGORY_CARDS = [
  { name: 'Electronics', slug: 'electronics-gadgets', icon: Laptop, color: 'bg-blue-50 text-[#30358F] border-blue-100', count: '180+ Items', tag: 'Trending' },
  { name: 'Fashion & Apparel', slug: 'fashion-apparel', icon: Shirt, color: 'bg-red-50 text-[#ED1C2E] border-red-100', count: '240+ Items', tag: 'Popular' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: HomeIcon, color: 'bg-amber-50 text-[#F7941D] border-amber-100', count: '95+ Items', tag: 'Essential' },
  { name: 'Grocery & Organic', slug: 'grocery', icon: Sparkle, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', count: '110+ Items', tag: 'Fresh' },
  { name: 'Beauty & Wellness', slug: 'beauty-personal-care', icon: Watch, color: 'bg-pink-50 text-pink-700 border-pink-100', count: '75+ Items', tag: 'Care' },
  { name: 'Accessories', slug: 'audio-sound', icon: HeadphonesIcon, color: 'bg-indigo-50 text-[#30358F] border-indigo-100', count: '65+ Items', tag: 'Top Rated' },
];

export const Home = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Showcase state from Super Admin
  const [showcase, setShowcase] = useState(null);

  // Referral Calculator State
  const [calcDirectInvites, setCalcDirectInvites] = useState(5);
  const [calcFriendSpend, setCalcFriendSpend] = useState(2000);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchShowcase();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const fetchShowcase = async () => {
    try {
      const res = await api.get('/products/home-showcase');
      if (res.data?.success && res.data?.data) {
        setShowcase(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load home showcase', err);
    }
  };

  const fetchFeaturedProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products', { params: { limit: 16, sort: 'rating' } });
      setFeaturedProducts(res.data?.data?.products || []);
    } catch (err) {
      console.error('Failed to load featured products for home page', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data?.success && res.data.data?.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map((p) => p._id));
      }
    } catch (e) {
      // Ignore if guest
    }
  };

  const handleToggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/wishlist', { productId });
      if (res.data?.success && res.data.data?.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map((p) => p._id));
      }
    } catch (err) {
      console.error('Wishlist toggle error', err);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    }
  };

  // Products filtered for the main tabs
  const filteredProducts = featuredProducts.filter((p) => {
    if (activeTab === 'deals') return (p.mrp && p.mrp > p.price) || (p.discountPrice > 0 && p.discountPrice < p.price);
    if (activeTab === 'highRating') return (p.rating || 4.5) >= 4.5;
    return true;
  });

  // Indian / Made in India products filter
  const indianProducts = featuredProducts.filter((p) => {
    return p.isMadeInIndia || p.origin?.toLowerCase() === 'india' || p.countryOfOrigin?.toLowerCase() === 'india';
  });
  // Fallback to top products if data doesn't have explicit country tags yet
  const displayIndianProducts = indianProducts.length > 0 ? indianProducts : featuredProducts.slice(0, 8);

  // Best Sellers (higher ratings / sales)
  const bestSellers = [...featuredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

  // Approx 3-5% network yield per level
  const estimatedCoinsMonthly = Math.round(
    calcDirectInvites * (calcFriendSpend * 0.05) + Math.pow(calcDirectInvites, 2) * (calcFriendSpend * 0.015)
  );

  return (
    <div className="relative min-h-screen space-y-16 pb-24 text-[#222222] bg-[#FFFFFF] overflow-hidden">
      {/* Engineered Subtle Dot Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(48, 53, 143, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(48, 53, 143, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <HeroSection banners={showcase?.banners} />

      {/* ========================================================================= */}
      {/* 2. PROMOTIONAL OFFERS & FLASH DEALS BANNER                                */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-red-50 via-orange-50/70 to-amber-50 rounded-3xl p-6 sm:p-8 border border-[#ED1C2E]/20 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ED1C2E]/10 text-[#ED1C2E] text-xs font-black uppercase tracking-wider border border-[#ED1C2E]/20">
                <Zap className="w-4 h-4 text-[#ED1C2E]" />
                <span>{showcase?.flashSale?.badge || 'Special Promotional Offers'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
                {showcase?.flashSale?.title || 'Supercharged Deals • Up to 60% OFF'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                {showcase?.flashSale?.subtitle || 'Verified Indian products with direct manufacturer savings and fast delivery.'}
              </p>
            </div>

            {/* Verified Savings Highlights */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white shadow-xs rounded-2xl px-4 py-3 border border-red-200">
                <Percent className="w-5 h-5 text-[#ED1C2E]" />
                <div>
                  <div className="text-xs font-black text-slate-900">Direct From Source</div>
                  <div className="text-[10px] text-slate-500 font-medium">Zero Middleman Markups</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white shadow-xs rounded-2xl px-4 py-3 border border-red-200">
                <Truck className="w-5 h-5 text-[#30358F]" />
                <div>
                  <div className="text-xs font-black text-slate-900">Pan-India Express</div>
                  <div className="text-[10px] text-slate-500 font-medium">Free On Orders Above ₹499</div>
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to={showcase?.flashSale?.buttonLink || '/products?discount=true'}
                className="px-6 py-3.5 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-red-500/20 transition-all shrink-0 flex items-center gap-2"
              >
                <span>{showcase?.flashSale?.buttonText || 'Explore Best Deals'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CATEGORY SECTION                                                       */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#30358F]" />
              <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                Shop by Category
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Explore authentic products across India's premier retail categories</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#30358F] hover:text-[#ED1C2E] transition"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_CARDS.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 hover:border-[#ED1C2E]/40 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center space-y-2.5 h-full"
                >
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#222222] group-hover:text-[#ED1C2E] transition-colors line-clamp-1">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{cat.count}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F7F9] text-slate-600 border border-slate-200/60">
                    {cat.tag}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INDIAN PRODUCTS / MADE IN INDIA SECTION                                */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#30358F]/5 via-orange-50/40 to-red-50/30 border border-[#30358F]/20 p-6 sm:p-10 space-y-8">
          {/* Section Header with BAAPOO MART Mission */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#30358F]/15 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#30358F] text-white text-xs font-black uppercase tracking-wider">
                <Flag className="w-3.5 h-3.5 text-[#F7941D]" />
                <span>BUY INDIAN • BUILD INDIA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight">
                Authentic Indian Products Showcase
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Supporting domestic manufacturers, artisans, and enterprises. Every purchase strengthens our national economy.
              </p>
            </div>

            <Link
              to="/products?origin=India"
              className="px-6 py-3.5 rounded-2xl bg-[#30358F] hover:bg-[#252972] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <span>Explore Indian Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Indian Products Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="aspect-square bg-slate-100 rounded-xl w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayIndianProducts.slice(0, 4).map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={{ ...prod, isMadeInIndia: true }}
                  isWishlisted={wishlistProductIds.includes(prod._id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURED PRODUCTS WITH REUSABLE PRODUCT CARDS                           */}
      {/* ========================================================================= */}
      {showcase?.showTopSellingProducts !== false && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#ED1C2E]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                  {showcase?.topSellingProductsTitle || 'Featured Products'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Top-rated items handpicked for quality and value at BAAPOO MART</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'deals', label: 'Discount Deals' },
                { id: 'highRating', label: 'Top Rated (4.5+)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#ED1C2E] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid with Animations */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="aspect-square bg-slate-100 rounded-xl w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded w-full mt-2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-bold text-sm text-[#222222]">No featured products found in this view</p>
              <Link to="/products" className="inline-flex items-center gap-1.5 text-xs text-[#30358F] font-bold hover:underline">
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  isWishlisted={wishlistProductIds.includes(prod._id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. BEST SELLERS & TRENDING SECTION                                        */}
      {/* ========================================================================= */}
      {bestSellers.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F7941D]" />
              <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                Trending & Best Sellers
              </h2>
            </div>
            <Link to="/products?sort=popular" className="inline-flex items-center gap-1 text-xs font-bold text-[#30358F] hover:text-[#ED1C2E] transition">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((prod) => (
              <ProductCard
                key={`bestseller-${prod._id}`}
                product={prod}
                isWishlisted={wishlistProductIds.includes(prod._id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. TOP VERIFIED SELLERS (SUPER ADMIN CONTROLLED)                          */}
      {/* ========================================================================= */}
      {showcase?.showTopSellers !== false && showcase?.topVendors?.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#30358F]" />
              <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                {showcase?.topSellersTitle || 'Top Verified Indian Merchants'}
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Vetted Local Sellers</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {showcase.topVendors.map((v, idx) => {
              const storeName = v?.storeName || v?.name || 'Verified Store';
              return (
                <motion.div
                  key={v?._id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-200/80 hover:border-[#30358F]/40 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#30358F] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {v?.logo ? (
                      <img src={v.logo} alt={storeName} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-[#222222] truncate">{storeName}</h3>
                      <BadgeCheck className="w-3.5 h-3.5 text-[#30358F] shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{v?.rating && Number(v.rating) > 0 ? Number(v.rating).toFixed(1) : 'Verified'}</span>
                      </span>
                      <span>•</span>
                      <span>{v?.totalProducts || 1}+ Items</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. REWARDS & MEMBERSHIP CALLOUT                                           */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl bg-gradient-to-r from-red-50 via-orange-50/60 to-amber-50 text-[#222222] p-6 sm:p-10 border border-[#ED1C2E]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#ED1C2E] text-xs font-bold uppercase tracking-wider border border-red-200 shadow-2xs">
              <Crown className="w-4 h-4 text-[#ED1C2E]" />
              <span>BAAPOO MART VIP Privilege</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#222222]">
              Unlock Priority Shipping & Exclusive Indian Artisan Discounts
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Join the BAAPOO MART membership community for exclusive domestic manufacturer discounts, priority logistics dispatch, and cashback coins on every order.
            </p>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/customer/subscription"
              className="px-7 py-3.5 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-red-500/20 transition-all shrink-0 block text-center"
            >
              Explore VIP Benefits
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 9. WHY BAAPOO MART: FOUR TRUST PILLARS                                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-[#222222]">Why India Trusts BAAPOO MART</h3>
          <p className="text-xs text-slate-500">Dedicated to transparent, secure, and community-empowered Indian commerce</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#ED1C2E] flex items-center justify-center border border-red-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#222222]">100% Escrow Security</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Buyer payments are safeguarded securely until package delivery is verified and accepted by you.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F7941D] flex items-center justify-center border border-orange-100">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#222222]">Transparent Rewards</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Earn reward coins on every order and redeem without restrictive minimum purchase bars.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#30358F] flex items-center justify-center border border-blue-100">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#222222]">Pan-India Delivery</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Express delivery network across Indian pincodes with real-time package tracking.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2.5"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-[#30358F] flex items-center justify-center border border-slate-200">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-[#222222]">7-Day Easy Returns</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Convenient doorstep pickup returns with prompt replacements or direct bank refunds on eligible items.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
