import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Gift, Zap, Share2, Coins, Flag } from 'lucide-react';
import BrandLogo from '../BrandLogo';

export const AuthLayout = ({
  children,
  badge = 'BAAPOO MART • BUY INDIAN • BUILD INDIA',
  title = 'Shop Indian. Build India.',
  subtitle = 'Discover verified Indian manufacturers, quality products, and direct artisan commerce.',
  imageSrc = '/images/baapoo-mart-logo.png',
  imageAlt = 'BAAPOO MART: BUY INDIAN • BUILD INDIA',
  features = [
    { icon: Flag, text: 'BUY INDIAN • BUILD INDIA Commerce' },
    { icon: Gift, text: 'Earn Cashback Coins on every order' },
    { icon: ShieldCheck, text: '100% Verified Indian Merchants & Escrow' },
  ],
  theme = 'red',
}) => {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] overflow-hidden">
      {/* Subtle Grid Box Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(48, 53, 143, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(48, 53, 143, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Ambient Floating Halos */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Container */}
      <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14 z-10 my-auto">
        {/* Left Column: Brand Hero Artwork & Badges */}
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="hidden lg:flex flex-1 flex-col items-start max-w-md xl:max-w-lg"
        >
          {/* Mission Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#30358F]/10 border border-[#30358F]/20 text-[#30358F] text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
            <Flag className="w-3.5 h-3.5 text-[#F7941D]" />
            <span>{badge}</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black text-[#222222] tracking-tight leading-tight mb-2.5">
            {title}
          </h1>
          <p className="text-xs xl:text-sm text-slate-600 mb-6 leading-relaxed">
            {subtitle}
          </p>

          {/* Central Logo Display */}
          <div className="relative w-full my-2">
            <div className="relative w-full rounded-3xl p-6 bg-gradient-to-br from-white via-[#F7F7F9] to-red-50/40 border border-slate-200/90 shadow-xl overflow-hidden flex flex-col items-center text-center">
              <div className="py-4">
                <img
                  src="/images/baapoo-mart-logo.png"
                  alt="BAAPOO MART: BUY INDIAN • BUILD INDIA"
                  className="max-h-48 w-auto object-contain drop-shadow-sm select-none"
                />
              </div>

              {/* Trust Pill */}
              <div className="mt-4 w-full p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-7 h-7 rounded-lg bg-[#ED1C2E] text-white flex items-center justify-center font-black text-xs">
                    BM
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#222222]">Official BAAPOO MART</div>
                    <div className="text-[10px] text-slate-500">100% Verified Indian Marketplace</div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Feature Bullets */}
          <div className="grid grid-cols-1 gap-2 w-full mt-4">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-xs font-bold text-[#222222]"
                >
                  <div className="w-6 h-6 rounded-lg bg-red-50 text-[#ED1C2E] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full flex justify-center flex-1 max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
