import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo - Displays the official BAAPOO MART logo asset
 * Preserves the original logo file, proportions, and alt text.
 */
export const BrandLogo = ({
  size = 'md',
  clickable = true,
  className = '',
  imgClassName = '',
  showTagline = false,
}) => {
  // Height presets matching header, sidebar, auth cards, and footers
  const sizeMap = {
    xs: 'h-8 sm:h-9',
    sm: 'h-9 sm:h-11',
    md: 'h-11 sm:h-14',
    lg: 'h-14 sm:h-18',
    xl: 'h-20 sm:h-24',
    hero: 'h-24 sm:h-32',
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 transition-transform ${clickable ? 'group hover:opacity-95' : ''} ${className}`}>
      <img
        src="/images/baapoo-mart-logo.png"
        alt="BAAPOO MART: Buy Indian, Build India"
        className={`${selectedSize} w-auto object-contain max-w-full drop-shadow-xs select-none ${imgClassName}`}
        loading="eager"
      />
      {showTagline && (
        <span className="hidden sm:inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#30358F] border-l-2 border-[#F7941D] pl-2.5 py-0.5">
          BUY INDIAN • BUILD INDIA
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" aria-label="BAAPOO MART Home" className="shrink-0 flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
