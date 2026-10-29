import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShoppingBag,
  Coins,
  Store,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Star,
  Heart,
  Check,
  Truck,
  RotateCcw,
  Flag,
  Share2,
  Plus,
  Minus,
  Zap
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant State
  const [selectedVariantSku, setSelectedVariantSku] = useState('');

  // Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reviews and summary state
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);

  // New Review Form State
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewImages, setReviewImages] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  useEffect(() => {
    fetchProduct();
    checkWishlist();
  }, [slug]);

  const checkWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data?.success && res.data.data.wishlist && product?._id) {
        const productIds = res.data.data.wishlist.products.map((p) => p._id);
        setIsWishlisted(productIds.includes(product._id));
      }
    } catch (e) {
      // User may be guest
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    setWishlistLoading(true);
    try {
      const res = await api.post('/wishlist', { productId: product._id });
      if (res.data?.success && res.data.data.wishlist) {
        const productIds = res.data.data.wishlist.products.map((p) => p._id);
        setIsWishlisted(productIds.includes(product._id));
      }
    } catch (err) {
      alert('Please login to save products to your Wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${slug}`);
      const prod = res.data.data.product;
      setProduct(prod);
      
      // Auto-select first variant SKU if available
      if (prod.variants && prod.variants.length > 0) {
        setSelectedVariantSku(prod.variants[0].sku);
      }
      
      // Fetch reviews once product is loaded
      fetchReviews(prod._id);

      // Fetch related products from category
      const catParam = prod.categoryId?.slug || prod.category;
      if (catParam) {
        api.get('/products', { params: { category: catParam, limit: 5 } })
          .then((catRes) => {
            const list = catRes.data?.data?.products || [];
            setRelatedProducts(list.filter((p) => p._id !== prod._id).slice(0, 4));
          })
          .catch(() => {});
      }

      // Check wishlist for this product
      api.get('/wishlist').then((wRes) => {
        if (wRes.data?.success && wRes.data.data.wishlist) {
          const pIds = wRes.data.data.wishlist.products.map((p) => p._id);
          setIsWishlisted(pIds.includes(prod._id));
        }
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (productId, page = 1) => {
    setReviewsLoading(true);
    try {
      const res = await api.get(`/reviews/product/${productId}`, { params: { page, limit: 5 } });
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
        setReviewsSummary(res.data.data.summary || { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
        setReviewPages(res.data.data.pages || 1);
        setReviewPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const getActiveDetails = () => {
    if (!product) return null;
    
    let name = product.name;
    let originalPrice = Number(product.price || 0);
    let discountPrice = Number(product.discountPrice || 0);
    let sellingPrice = discountPrice > 0 && discountPrice < originalPrice ? discountPrice : originalPrice;
    let mrpVal = Number(product.mrp || product.originalPrice || 0);
    let stock = product.stock;
    let sku = product.sku;
    let images = product.images && product.images.length > 0
      ? product.images.map(img => typeof img === 'string' ? img : img?.url)
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

    if (selectedVariantSku && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.sku === selectedVariantSku);
      if (variant) {
        name = `${product.name} - ${variant.name}`;
        originalPrice = Number(variant.price || originalPrice);
        discountPrice = Number(variant.discountPrice || 0);
        sellingPrice = discountPrice > 0 && discountPrice < originalPrice ? discountPrice : originalPrice;
        if (variant.mrp) mrpVal = Number(variant.mrp);
        stock = variant.stock;
        sku = variant.sku;
        if (variant.images && variant.images.length > 0) {
          images = variant.images;
        }
      }
    }

    const candidateMrp = mrpVal > 0 ? mrpVal : (discountPrice > 0 && originalPrice > sellingPrice ? originalPrice : 0);
    const effectiveMrp = candidateMrp > sellingPrice ? candidateMrp : null;

    return { name, price: originalPrice, discountPrice, sellingPrice, mrp: effectiveMrp, stock, sku, images };
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await api.post('/cart/add', {
        productId: product._id,
        quantity,
        variantSku: selectedVariantSku || undefined,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setBuyingNow(true);
    try {
      await api.post('/cart/add', {
        productId: product._id,
        quantity,
        variantSku: selectedVariantSku || undefined,
      });
      navigate('/checkout');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate('/login?redirect=/checkout');
      }
    } finally {
      setBuyingNow(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewSuccessMsg('');
    setReviewErrorMsg('');

    try {
      const imageArray = reviewImages
        ? reviewImages.split(',').map((u) => u.trim()).filter(Boolean)
        : [];

      const res = await api.post('/reviews', {
        productId: product._id,
        rating,
        title: reviewTitle,
        comment: reviewBody,
        images: imageArray,
      });

      if (res.data?.success) {
        setReviewSuccessMsg('Your verified review has been published!');
        setReviewTitle('');
        setReviewBody('');
        setReviewImages('');
        setRating(5);
        fetchReviews(product._id, 1);
      }
    } catch (err) {
      setReviewErrorMsg(err.response?.data?.message || 'Failed to submit review. You must have purchased this item.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 text-[#ED1C2E] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading BAAPOO MART Product...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-xl font-black text-[#222222]">Product Not Found</div>
        <p className="text-xs text-slate-500">The product you are looking for is unavailable or has been removed.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ED1C2E] text-white text-xs font-black uppercase tracking-wider"
        >
          <span>Browse All Products</span>
        </Link>
      </div>
    );
  }

  const details = getActiveDetails();
  const totalReviewsCount = reviewsSummary.totalReviews || 1;
  const ratingAvg = reviewsSummary.averageRating || 0;
  const isIndianProduct = product.isMadeInIndia || product.origin?.toLowerCase() === 'india' || product.countryOfOrigin?.toLowerCase() === 'india' || true;

  const currentImage = details.images[activeImageIndex] || details.images[0];

  const hasDiscount = Boolean(details.mrp && details.mrp > details.sellingPrice);
  const discountPct = hasDiscount
    ? Math.round(((details.mrp - details.sellingPrice) / details.mrp) * 100)
    : (product.discountValue || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 bg-[#FFFFFF] min-h-screen">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#ED1C2E] font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30358F]/10 text-[#30358F] text-[11px] font-black uppercase tracking-wider">
          <Flag className="w-3.5 h-3.5 text-[#F7941D]" />
          <span>BUY INDIAN • BUILD INDIA</span>
        </div>
      </div>

      {/* Main product card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white border border-slate-200/90 p-6 sm:p-10 rounded-3xl shadow-xs">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-square bg-[#F7F7F9] rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center p-4">
            <img
              src={currentImage}
              alt={details.name}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
              }}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {discountPct > 0 && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-[#F7941D] text-white shadow-xs">
                  {discountPct}% OFF
                </span>
              )}
              {isIndianProduct && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-[#30358F] text-white shadow-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F7941D]" /> Made in India
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#ED1C2E] hover:border-[#ED1C2E]/40 transition-colors shadow-xs"
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#ED1C2E] text-[#ED1C2E]' : ''}`} />
            </button>
          </div>

          {/* Thumbnails row */}
          {details.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Product image gallery thumbnails">
              {details.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View ${details.name} image ${idx + 1} of ${details.images.length}`}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-[#F7F7F9] shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-[#ED1C2E] shadow-xs ring-2 ring-[#ED1C2E]/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`${details.name} thumbnail ${idx + 1}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Vendor & Category strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#30358F]/10 text-[#30358F] text-xs font-black uppercase tracking-wider">
                {product.categoryId?.name || product.category || 'Indian Store'}
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Seller: {product.vendorId?.storeName || 'Verified Indian Merchant'}</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#222222] tracking-tight leading-tight">
              {details.name}
            </h1>

            {/* Ratings Header */}
            <div className="flex items-center gap-2 text-xs">
              {reviewsSummary.totalReviews > 0 ? (
                <>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    <span>{ratingAvg.toFixed(1)}</span>
                    <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                  </div>
                  <span className="text-slate-500 font-semibold">({reviewsSummary.totalReviews} verified ratings)</span>
                </>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 font-medium">
                  <span>No reviews yet</span>
                </div>
              )}
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">Authentic Indian Stock</span>
            </div>

            {/* Price display */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F9] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                {hasDiscount && (
                  <span className="text-sm sm:text-base text-slate-400 line-through font-medium leading-none mb-1">
                    ₹{Number(details.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                <span className="text-3xl sm:text-4xl font-black text-[#222222] leading-tight">
                  ₹{Number(details.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#F7941D] text-white text-xs font-black uppercase tracking-wider shadow-xs">
                    {discountPct}% OFF
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Save ₹{(details.mrp - details.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#30358F]">Description & Specifications</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description || 'Curated high-quality product proudly sourced from verified Indian manufacturers on BAAPOO MART.'}
              </p>
            </div>

            {/* Stock status & SKU */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Availability: </span>
                {details.stock > 0 ? (
                  <span className="text-emerald-700 font-bold">In Stock ({details.stock} units ready to dispatch)</span>
                ) : (
                  <span className="text-[#ED1C2E] font-bold">Currently Out of Stock</span>
                )}
              </div>
              <span className="text-slate-300">|</span>
              <div>
                <span className="text-slate-500 font-medium">SKU: </span>
                <span className="font-mono font-bold text-[#222222]">{details.sku || 'BPM-IND'}</span>
              </div>
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-black text-[#222222] uppercase tracking-wider">Choose Option / Variant:</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariantSku(v.sku)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedVariantSku === v.sku
                          ? 'bg-[#30358F] border-[#30358F] text-white shadow-xs'
                          : 'bg-[#F7F7F9] border-slate-200 text-slate-700 hover:border-[#30358F]/40'
                      }`}
                    >
                      {v.name} (₹{Number(v.discountPrice > 0 ? v.discountPrice : v.price).toLocaleString('en-IN')})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#222222]">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-slate-100 text-slate-600 transition"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-black text-[#222222]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(details.stock || 10, quantity + 1))}
                  className="p-2 hover:bg-slate-100 text-slate-600 transition"
                  disabled={quantity >= (details.stock || 10)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: Add to Cart (Red) & Buy Now (Navy Blue) */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Primary Red: Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={adding || details.stock <= 0}
                className="py-3.5 px-6 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : added ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Added to Cart!</span>
                  </>
                ) : details.stock <= 0 ? (
                  <span>Out of Stock</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              {/* Secondary Navy Blue: Buy Now */}
              <button
                onClick={handleBuyNow}
                disabled={buyingNow || details.stock <= 0}
                className="py-3.5 px-6 rounded-2xl bg-[#30358F] hover:bg-[#252972] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
              >
                {buyingNow ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-[#F7941D]" />
                    <span>Buy Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust assurances strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-600">
              <div className="p-2.5 rounded-xl bg-[#F7F7F9] border border-slate-200/80 space-y-1">
                <Truck className="w-4 h-4 mx-auto text-[#30358F]" />
                <div className="font-bold text-[#222222]">Pan-India Delivery</div>
                <div className="text-[10px] text-slate-400">Express Pincode Dispatch</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F7F9] border border-slate-200/80 space-y-1">
                <ShieldCheck className="w-4 h-4 mx-auto text-[#ED1C2E]" />
                <div className="font-bold text-[#222222]">100% Genuine</div>
                <div className="text-[10px] text-slate-400">Verified Origin Guarantee</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F7F9] border border-slate-200/80 space-y-1">
                <RotateCcw className="w-4 h-4 mx-auto text-[#F7941D]" />
                <div className="font-bold text-[#222222]">7-Day Returns</div>
                <div className="text-[10px] text-slate-400">Easy Doorstep Pickup</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings & reviews section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Summaries */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-black text-xs text-[#222222] uppercase tracking-wider">Customer Ratings</h3>
            
            <div className="text-center py-4 bg-[#F7F7F9] rounded-xl space-y-1 border border-slate-100">
              <div className="text-3xl font-black text-[#222222]">{ratingAvg.toFixed(1)}</div>
              <div className="flex justify-center text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(ratingAvg) ? 'fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">Based on {reviewsSummary.totalReviews} verified reviews</div>
            </div>

            {/* Stars Progress bars */}
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsSummary.distribution[stars] || 0;
                const percentage = Math.round((count / totalReviewsCount) * 100);
                return (
                  <div key={stars} className="flex items-center gap-2 text-slate-600">
                    <span className="w-3 text-right font-bold">{stars}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-[10px] text-slate-400 font-bold">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Review Form */}
          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-black text-xs text-[#222222] uppercase tracking-wider">Rate & Review Product</h3>
            <p className="text-[11px] text-slate-500">Help fellow Indian shoppers make informed choices.</p>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Your Rating</label>
                <div className="flex gap-1 text-amber-500 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-current' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Summarize your review"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-[#F7F7F9] text-xs text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ED1C2E] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-bold mb-1">Feedback</label>
                <textarea
                  rows="3"
                  placeholder="What did you like or dislike about the product?"
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  className="w-full bg-[#F7F7F9] text-xs text-slate-800 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ED1C2E] focus:bg-white"
                ></textarea>
              </div>

              {reviewSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-bold">
                  {reviewSuccessMsg}
                </div>
              )}
              {reviewErrorMsg && (
                <div className="p-3 bg-red-50 text-[#ED1C2E] text-xs rounded-xl border border-red-200 font-bold">
                  {reviewErrorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs min-h-[40vh] space-y-6">
            <h3 className="font-black text-sm text-[#222222]">Customer Reviews ({reviewsSummary.totalReviews})</h3>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-[#ED1C2E] animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                No reviews yet for this product. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pb-6 border-b border-slate-100 last:border-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs text-[#ED1C2E] font-bold border border-red-200">
                          {rev.userId?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#222222]">{rev.userId?.name || 'Customer'}</div>
                          <div className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                          <Check className="w-3 h-3" />
                          <span>Verified Purchase</span>
                        </span>
                      )}
                    </div>

                    <div>
                      {rev.title && <h5 className="text-xs font-bold text-slate-800 mb-1">{rev.title}</h5>}
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment || rev.body}</p>
                    </div>
                  </div>
                ))}

                {reviewPages > 1 && (
                  <div className="flex items-center gap-2 justify-end pt-2">
                    <button
                      onClick={() => fetchReviews(product._id, reviewPage - 1)}
                      disabled={reviewPage === 1}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-100 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] text-slate-500 font-semibold">Page {reviewPage} of {reviewPages}</span>
                    <button
                      onClick={() => fetchReviews(product._id, reviewPage + 1)}
                      disabled={reviewPage === reviewPages}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related and Recommended Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#222222] tracking-tight">
                Related & Recommended Products
              </h3>
              <p className="text-xs text-slate-500">
                Explore more authentic products from verified Indian vendors
              </p>
            </div>
            <Link
              to={`/products?category=${product.categoryId?.slug || product.category || ''}`}
              className="text-xs font-bold text-[#ED1C2E] hover:underline"
            >
              View More in Category →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((relProd) => (
              <ProductCard key={relProd._id} product={relProd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
