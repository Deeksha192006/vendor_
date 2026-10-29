import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Package,
  Layers,
  ChevronDown,
  X,
  Menu,
  ShieldCheck,
  Store,
  Crown,
  HelpCircle,
  Truck,
  Phone,
  Flag,
  Flame
} from 'lucide-react';
import { logoutUser } from '../../store/authSlice';
import BrandLogo from '../BrandLogo';
import api from '../../services/api';

export const Header = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync search input if URL has search param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  // Fetch cart & wishlist count
  const fetchCounts = async () => {
    try {
      const [cartRes, wishRes] = await Promise.allSettled([
        api.get('/cart'),
        isAuthenticated ? api.get('/wishlist') : Promise.resolve({ data: { data: { wishlist: { products: [] } } } }),
      ]);

      if (cartRes.status === 'fulfilled' && cartRes.value?.data?.data?.cart?.items) {
        const totalItems = cartRes.value.data.data.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(totalItems);
      } else if (cartRes.status === 'fulfilled' && cartRes.value?.data?.data?.items) {
        setCartCount(cartRes.value.data.data.items.length);
      }

      if (wishRes.status === 'fulfilled' && wishRes.value?.data?.data?.wishlist?.products) {
        setWishlistCount(wishRes.value.data.data.wishlist.products.length);
      }
    } catch (err) {
      // Quiet fail for guest
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      {/* 1. TOP BRAND BANNER STRIP */}
      <div className="bg-[#30358F] text-white py-1.5 px-4 text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#F7941D] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
              🇮🇳 BUY INDIAN • BUILD INDIA
            </span>
            <span className="hidden md:inline text-white/90 text-[11px]">
              Empowering Indian artisans, manufacturers & direct vendors
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-white/85">
            <Link to="/vendor/login" className="hover:text-[#F7941D] transition flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              <span>Sell on BAAPOO MART</span>
            </Link>
            <span className="text-white/30">•</span>
            <Link to="/customer/help" className="hover:text-[#F7941D] transition flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Customer Help</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Logo */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-[#ED1C2E] hover:bg-slate-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <BrandLogo size="md" showTagline={false} />
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl hidden md:flex items-center relative"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full bg-[#F7F7F9] border border-slate-300 rounded-full py-2.5 pl-5 pr-24 text-xs sm:text-sm text-[#222222] focus:outline-none focus:border-[#ED1C2E] focus:bg-white focus:ring-2 focus:ring-[#ED1C2E]/10 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#ED1C2E] hover:bg-[#D91425] text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Right Action Icons: Account, Wishlist, Cart */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Account Dropdown */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 text-slate-800 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#30358F] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {user?.name ? user.name[0] : 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-[11px] text-slate-400 font-semibold leading-tight">Hello,</div>
                      <div className="text-xs font-bold text-[#222222] line-clamp-1 max-w-[100px] leading-tight">
                        {user?.name?.split(' ')[0] || 'My Account'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="font-bold text-xs text-[#222222]">{user?.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{user?.email}</div>
                        <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAEBFA] text-[#30358F]">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1 text-xs text-slate-700">
                        {user?.role === 'SUPER_ADMIN' ? (
                          <Link
                            to="/super-admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 font-semibold text-[#30358F]"
                          >
                            <Crown className="w-4 h-4 text-[#F7941D]" />
                            <span>Super Admin Console</span>
                          </Link>
                        ) : user?.role === 'VENDOR' ? (
                          <Link
                            to="/vendor/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 font-semibold text-[#30358F]"
                          >
                            <Store className="w-4 h-4 text-[#ED1C2E]" />
                            <span>Vendor Dashboard</span>
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/customer/dashboard"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 font-semibold"
                            >
                              <Layers className="w-4 h-4 text-slate-500" />
                              <span>Customer Dashboard</span>
                            </Link>
                            <Link
                              to="/customer/orders"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                            >
                              <Package className="w-4 h-4 text-slate-500" />
                              <span>My Orders</span>
                            </Link>
                            <Link
                              to="/customer/profile"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                            >
                              <User className="w-4 h-4 text-slate-500" />
                              <span>My Profile</span>
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-[#ED1C2E] hover:bg-slate-50 transition"
                  >
                    <User className="w-4 h-4 text-[#30358F]" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ED1C2E] hover:bg-[#D91425] text-white shadow-xs transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <Link
              to="/customer/wishlist"
              className="relative p-2 rounded-xl text-slate-700 hover:text-[#ED1C2E] hover:bg-slate-50 transition"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ED1C2E] text-white text-[9px] font-black flex items-center justify-center">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart Icon */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#F7F7F9] hover:bg-slate-100 border border-slate-200 text-slate-800 hover:border-[#ED1C2E]/40 transition group"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-[#30358F] group-hover:text-[#ED1C2E] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ED1C2E] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-[#222222]">
                Cart
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (Only visible on small devices) */}
        <form onSubmit={handleSearchSubmit} className="mt-3 md:hidden">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands and more"
              className="w-full bg-[#F7F7F9] border border-slate-300 rounded-full py-2 pl-4 pr-10 text-xs text-[#222222] focus:outline-none focus:border-[#ED1C2E] focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[#ED1C2E]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. CATEGORY NAVIGATION BAR */}
      <div className="border-t border-slate-100 bg-[#F7F7F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar text-xs font-bold text-slate-700 whitespace-nowrap">
            <Link
              to="/products"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition flex items-center gap-1.5 text-[#30358F]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Products</span>
            </Link>

            <span className="text-slate-300">|</span>

            <Link
              to="/products?category=electronics-gadgets"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition"
            >
              Electronics
            </Link>

            <Link
              to="/products?category=fashion-apparel"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition"
            >
              Fashion
            </Link>

            <Link
              to="/products?category=home-kitchen"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition"
            >
              Home & Kitchen
            </Link>

            <Link
              to="/products?category=grocery-staples"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition"
            >
              Grocery
            </Link>

            <Link
              to="/products?category=beauty-personal-care"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition"
            >
              Beauty
            </Link>

            <Link
              to="/products?category=watches-wearables"
              className="px-3 py-1.5 rounded-lg hover:bg-white hover:text-[#ED1C2E] transition"
            >
              Accessories
            </Link>

            <span className="text-slate-300">|</span>

            <Link
              to="/products?origin=India"
              className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F7941D] hover:bg-orange-100 border border-orange-200/60 transition flex items-center gap-1.5 font-extrabold"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Made in India</span>
            </Link>

            <Link
              to="/products?filter=deals"
              className="px-3 py-1.5 rounded-lg bg-red-50 text-[#ED1C2E] hover:bg-red-100 border border-red-200/60 transition flex items-center gap-1.5 font-extrabold"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Daily Deals</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* 4. MOBILE SLIDE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <BrandLogo size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-1">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#30358F] px-3 mb-2">
                  Marketplace Categories
                </div>
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  All Products
                </Link>
                <Link
                  to="/products?category=electronics-gadgets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Electronics
                </Link>
                <Link
                  to="/products?category=fashion-apparel"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fashion
                </Link>
                <Link
                  to="/products?category=home-kitchen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Home & Kitchen
                </Link>
                <Link
                  to="/products?category=grocery-staples"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Grocery
                </Link>
                <Link
                  to="/products?category=beauty-personal-care"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Beauty
                </Link>
                <Link
                  to="/products?category=watches-wearables"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Accessories
                </Link>
                <Link
                  to="/products?origin=India"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-extrabold text-[#F7941D] bg-orange-50"
                >
                  🇮🇳 Made in India
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#30358F] px-3 mb-2">
                  Account & Portals
                </div>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/customer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/customer/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Shopping Cart ({cartCount})
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-xl text-center text-sm font-bold text-white bg-[#ED1C2E] shadow-sm"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-xl text-center text-sm font-bold text-[#30358F] bg-[#EAEBFA]"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-center">
              <div className="text-[11px] font-bold text-[#30358F]">BAAPOO MART</div>
              <div className="text-[10px] text-slate-400">BUY INDIAN • BUILD INDIA</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
