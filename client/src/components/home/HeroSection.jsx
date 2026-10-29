import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export const HeroSection = ({ banners: initialBanners }) => {
  const [banners, setBanners] = useState(initialBanners || []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});

  // Sync prop changes or fetch active banners from backend
  useEffect(() => {
    if (initialBanners && initialBanners.length > 0) {
      setBanners(initialBanners);
    } else if (!initialBanners) {
      api.get('/banners/active')
        .then((res) => {
          if (res.data?.success && res.data?.data?.banners) {
            setBanners(res.data.data.banners);
          }
        })
        .catch(() => {
          // Gracefully fallback
        });
    }
  }, [initialBanners]);

  // Auto-play carousel when multiple banners are available
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const activeBanner = banners.length > 0 ? banners[currentSlide % banners.length] : null;

  // Determine if banner has any textual or CTA content to overlay
  const hasOverlayContent = Boolean(
    activeBanner && (activeBanner.heading || activeBanner.subtitle || (activeBanner.buttonLabel && activeBanner.buttonDestinationUrl))
  );

  return (
    <section className="relative z-10 w-full overflow-hidden -mt-4 sm:-mt-6">
      <div
        className="relative w-full overflow-hidden bg-slate-900 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          {activeBanner ? (
            <motion.div
              key={activeBanner._id || currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-[52vh] sm:h-[62vh] lg:h-[75vh] min-h-[360px] sm:min-h-[460px] lg:min-h-[580px] flex items-center overflow-hidden"
            >
              {/* Full-Screen Promotional Image */}
              {activeBanner.buttonDestinationUrl && !hasOverlayContent ? (
                <Link
                  to={activeBanner.buttonDestinationUrl}
                  className="absolute inset-0 w-full h-full block cursor-pointer z-0"
                >
                  <img
                    src={
                      imageErrorMap[activeBanner._id]
                        ? '/images/baapoo-mart-logo.png'
                        : activeBanner.imageUrl
                    }
                    alt={activeBanner.altText || activeBanner.title || 'BAAPOO MART Promotional Banner'}
                    onError={() => setImageErrorMap((prev) => ({ ...prev, [activeBanner._id]: true }))}
                    className="w-full h-full object-cover object-center select-none"
                  />
                </Link>
              ) : (
                <img
                  src={
                    imageErrorMap[activeBanner._id]
                      ? '/images/baapoo-mart-logo.png'
                      : activeBanner.imageUrl
                  }
                  alt={activeBanner.altText || activeBanner.title || 'BAAPOO MART Promotional Banner'}
                  onError={() => setImageErrorMap((prev) => ({ ...prev, [activeBanner._id]: true }))}
                  className="absolute inset-0 w-full h-full object-cover object-center select-none"
                />
              )}

              {/* Text / Button Overlay - rendered ONLY if heading, subtitle, or button are configured */}
              {hasOverlayContent && (
                <>
                  {/* Subtle dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent max-w-3xl pointer-events-none z-10" />

                  <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center">
                    <div className="max-w-xl space-y-3 sm:space-y-4 text-white">
                      {/* Badge / Internal Title */}
                      {activeBanner.title && (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase tracking-wider border border-white/20 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-[#ED1C2E] animate-pulse" />
                          <span>{activeBanner.title}</span>
                        </div>
                      )}

                      {/* Heading */}
                      {activeBanner.heading && (
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md text-white">
                          {activeBanner.heading}
                        </h1>
                      )}

                      {/* Subtitle */}
                      {activeBanner.subtitle && (
                        <p className="text-sm sm:text-base lg:text-lg text-slate-100 line-clamp-3 max-w-lg leading-relaxed drop-shadow-sm font-medium">
                          {activeBanner.subtitle}
                        </p>
                      )}

                      {/* CTA Button */}
                      {activeBanner.buttonLabel && activeBanner.buttonDestinationUrl && (
                        <div className="pt-2 sm:pt-4">
                          <Link
                            to={activeBanner.buttonDestinationUrl}
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
                          >
                            <span>{activeBanner.buttonLabel}</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* Fallback Full-Screen Landscape Banner (when no active banners exist in DB) */
            <div className="relative w-full h-[52vh] sm:h-[62vh] lg:h-[75vh] min-h-[360px] sm:min-h-[460px] lg:min-h-[580px] flex items-center overflow-hidden bg-gradient-to-r from-[#30358F] via-[#252972] to-[#ED1C2E]">
              {/* Decorative Brand Ambient Shapes */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center">
                <div className="max-w-2xl space-y-4 text-white">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-black uppercase tracking-wider border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-[#ED1C2E] animate-pulse" />
                    <span>BUY INDIAN • BUILD INDIA</span>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                      Shop Indian. <br />
                      <span className="text-[#F7941D]">Support Indian.</span>
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-lg leading-relaxed font-medium">
                      Discover authentic collections from verified Indian weavers, artisans, and manufacturers with <span className="font-bold text-white">BAAPOO MART</span>.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <span>Shop Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Carousel Previous / Next Navigation Arrows (when multiple banners exist) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              aria-label="Previous Banner"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-white/20 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={handleNextSlide}
              aria-label="Next Banner"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-white/20 active:scale-95"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            {/* Dot Pagination Indicators */}
            <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/35 backdrop-blur-md border border-white/10 shadow-lg">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentSlide % banners.length
                      ? 'w-8 bg-[#ED1C2E]'
                      : 'w-2.5 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
