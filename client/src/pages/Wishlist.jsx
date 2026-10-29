import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Heart, ShoppingCart, Trash2, ArrowRight, Loader2, Flag } from 'lucide-react';
import { motion } from 'framer-motion';

export const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingCartId, setAddingCartId] = useState(null);

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/wishlist');
      if (res.data?.success) {
        setWishlist(res.data.data.wishlist);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      const res = await api.post('/wishlist', { productId });
      if (res.data?.success) {
        setWishlist(res.data.data.wishlist);
      }
    } catch (err) {
      console.error('Failed to remove product from wishlist:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    setAddingCartId(productId);
    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      alert('Product added to your BAAPOO MART cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item to cart');
      navigate('/login');
    } finally {
      setAddingCartId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#FFFFFF] min-h-screen">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30358F]/10 text-[#30358F] text-[10px] font-black uppercase tracking-wider mb-2">
              <Flag className="w-3.5 h-3.5 text-[#F7941D]" />
              <span>BUY INDIAN • BUILD INDIA</span>
            </div>
            <h1 className="text-2xl font-black text-[#222222] tracking-tight flex items-center gap-2.5">
              <Heart className="w-6 h-6 text-[#ED1C2E] fill-[#ED1C2E]" />
              <span>My Saved Wishlist</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Keep track of your favorite Indian marketplace products</p>
          </div>
          {wishlist?.products?.length > 0 && (
            <span className="px-3.5 py-1.5 rounded-full bg-red-50 text-[#ED1C2E] text-xs font-black border border-red-200 self-start sm:self-auto">
              {wishlist.products.length} Saved Item(s)
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="h-64 bg-slate-100 rounded-2xl"></div>
            <div className="h-64 bg-slate-100 rounded-2xl"></div>
            <div className="h-64 bg-slate-100 rounded-2xl"></div>
          </div>
        ) : !wishlist || wishlist.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-[#F7F7F9]">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-[#ED1C2E] flex items-center justify-center mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#222222]">Your wishlist is currently empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Explore products across our marketplace catalog and click the heart icon to save items here.
            </p>
            <Link
              to="/products"
              className="mt-5 px-6 py-3 bg-[#ED1C2E] hover:bg-[#D91425] text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-md shadow-red-500/20 transition-all inline-flex items-center gap-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.products.map((product) => (
              <motion.div
                key={product._id}
                whileHover={{ y: -3 }}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#ED1C2E]/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Product Image */}
                  <div className="h-48 bg-[#F7F7F9] flex items-center justify-center relative overflow-hidden border-b border-slate-100 p-2">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No Image Available</span>
                    )}
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-[#ED1C2E] hover:bg-red-50 flex items-center justify-center transition-colors shadow-2xs"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link
                      to={`/products/${product.slug || product._id}`}
                      className="font-bold text-[#222222] text-sm hover:text-[#ED1C2E] line-clamp-1 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'Verified product from certified Indian merchant'}
                    </p>
                    <div className="mt-3 flex flex-col justify-center">
                      {product.mrp && Number(product.mrp) > Number(product.price) ? (
                        <>
                          <span className="text-xs text-slate-400 line-through font-medium leading-none mb-1">
                            ₹{Number(product.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-base font-black text-[#222222] leading-tight">
                            ₹{Number(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : product.originalPrice && Number(product.originalPrice) > Number(product.price) ? (
                        <>
                          <span className="text-xs text-slate-400 line-through font-medium leading-none mb-1">
                            ₹{Number(product.originalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-base font-black text-[#222222] leading-tight">
                            ₹{Number(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-black text-[#222222] leading-tight">
                          ₹{Number(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    disabled={addingCartId === product._id}
                    className="w-full py-2.5 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {addingCartId === product._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Move to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
