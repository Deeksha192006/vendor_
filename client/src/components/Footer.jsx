import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Award,
  Heart,
  Store,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs mt-auto">
      {/* 1. Value Badges Bar */}
      <div className="bg-[#F7F7F9] border-b border-slate-200/80 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#ED1C2E] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-[#222222] text-xs">100% Verified Sellers</div>
              <div className="text-[11px] text-slate-500">Genuine Indian Products</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F7941D] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-[#222222] text-xs">Fast Pan-India Delivery</div>
              <div className="text-[11px] text-slate-500">Free shipping on ₹499+</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#30358F] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-[#222222] text-xs">Easy 7-Day Returns</div>
              <div className="text-[11px] text-slate-500">Hassle-free replacement</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-[#222222] text-xs">Dedicated Support</div>
              <div className="text-[11px] text-slate-500">Quick Indian Helpline</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo size="lg" showTagline={false} />
            <div className="inline-block px-3 py-1 rounded-full bg-[#EAEBFA] text-[#30358F] text-[11px] font-black uppercase tracking-wider">
              BUY INDIAN • BUILD INDIA
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              BAAPOO MART is India’s dedicated digital marketplace empowering indigenous manufacturers, local artisans, and homegrown retail brands. We connect proud Indian shoppers directly with verified Indian sellers.
            </p>
            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <span className="text-[11px] font-bold text-slate-700">Nationwide Hubs:</span>
              <span className="text-[11px]">Bangalore • Mumbai • Delhi • Hyderabad</span>
            </div>
          </div>

          {/* About & Mission */}
          <div>
            <h4 className="font-black text-[#30358F] text-xs uppercase tracking-wider mb-3.5">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="hover:text-[#ED1C2E] transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products?origin=India" className="hover:text-[#ED1C2E] transition font-bold text-[#F7941D]">
                  Buy Indian Mission
                </Link>
              </li>
              <li>
                <Link to="/vendor/login" className="hover:text-[#ED1C2E] transition flex items-center gap-1">
                  <Store className="w-3 h-3 text-[#ED1C2E]" />
                  <span>Sell on BAAPOO MART</span>
                </Link>
              </li>
              <li>
                <Link to="/vendor/onboarding" className="hover:text-[#ED1C2E] transition">
                  Merchant Partnership
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-black text-[#30358F] text-xs uppercase tracking-wider mb-3.5">Customer Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/customer/help" className="hover:text-[#ED1C2E] transition">
                  Customer Support
                </Link>
              </li>
              <li>
                <Link to="/customer/help?tab=contact" className="hover:text-[#ED1C2E] transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/customer/help?tab=faq" className="hover:text-[#ED1C2E] transition">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/customer/orders" className="hover:text-[#ED1C2E] transition">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Terms */}
          <div>
            <h4 className="font-black text-[#30358F] text-xs uppercase tracking-wider mb-3.5">Policies & Terms</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms/customer" className="hover:text-[#ED1C2E] transition">
                  Customer Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/terms/vendor" className="hover:text-[#ED1C2E] transition">
                  Vendor Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#ED1C2E] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-[#ED1C2E] transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#ED1C2E] transition">
                  Refund and Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-[#ED1C2E] transition">
                  Shipping and Delivery Policy
                </Link>
              </li>
              <li>
                <Link to="/grievance-policy" className="hover:text-[#ED1C2E] transition">
                  Grievance &amp; Redressal Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.openCookiePreferences && window.openCookiePreferences()}
                  className="hover:text-[#ED1C2E] transition text-left cursor-pointer flex items-center gap-1 text-slate-500 hover:underline"
                >
                  <span>Cookie Preferences</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Copyright & Trust Bar */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} BAAPOO MART. BUY INDIAN • BUILD INDIA. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/terms/customer" className="hover:text-slate-600">Terms</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-slate-600">Privacy</Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-slate-600">Refunds</Link>
            <span>•</span>
            <Link to="/shipping-policy" className="hover:text-slate-600">Shipping</Link>
            <span>•</span>
            <Link to="/grievance-policy" className="hover:text-slate-600">Grievances</Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => window.openCookiePreferences && window.openCookiePreferences()}
              className="hover:text-slate-600 cursor-pointer underline"
            >
              Cookie Choices
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 font-bold text-[#30358F]">
              <span>Proudly Built For India</span>
            </span>
            <span>•</span>
            <span>Verified Secure Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
