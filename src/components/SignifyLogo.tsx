import React from 'react';
import signifyLogoImg from '../assets/signify-logo.png';

export interface SignifyLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'icon' | 'wordmark' | 'combo' | 'badge';
  color?: string;
  glow?: boolean;
  withContainer?: boolean;
  alt?: string;
}

/**
 * Signify ASL "I Love You" (ILY) Logo.
 * Uses the official Signify logo artwork:
 * - Rounded squircle dark charcoal container tile
 * - Warm orange ASL ILY hand sign with organic gouache texture
 * - Clean anti-aliased transparency
 */
export const SignifyIcon: React.FC<{
  className?: string;
  size?: number | string;
  color?: string;
  glow?: boolean;
  withContainer?: boolean;
  alt?: string;
}> = ({
  className = 'w-10 h-10',
  size,
  glow = false,
  alt = 'Signify ASL ILY Hand Logo',
}) => {
  return (
    <img
      src={signifyLogoImg}
      alt={alt}
      className={`select-none object-contain ${glow ? 'drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]' : ''} ${className}`}
      style={size ? { width: size, height: size } : undefined}
      draggable={false}
    />
  );
};

/**
 * Pixel-precise SVG Wordmark matching the user's "SIGNIFY" typography image.
 * Features the signature bold square-rounded techno lettering.
 */
export const SignifyWordmark: React.FC<{
  className?: string;
  height?: number | string;
  color?: string;
}> = ({
  className = 'h-7 w-auto',
  height,
  color = '#FF4D26',
}) => {
  return (
    <svg
      viewBox="0 0 680 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={height ? { height } : undefined}
      aria-label="SIGNIFY"
    >
      <defs>
        <linearGradient id="signifyWordmarkOrange" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B1A" />
          <stop offset="50%" stopColor="#FF4D26" />
          <stop offset="100%" stopColor="#F53E0A" />
        </linearGradient>
      </defs>

      <g fill="url(#signifyWordmarkOrange)">
        {/* S */}
        <path
          d="
            M 42 20 
            L 92 20 
            C 104 20 112 28 112 40 
            L 112 44 
            C 112 56 104 64 92 64 
            L 52 64 
            L 52 82 
            L 94 82 
            C 106 82 112 88 112 100 
            L 112 110 
            L 42 110 
            C 30 110 22 102 22 90 
            L 22 86 
            C 22 74 30 66 42 66 
            L 82 66 
            L 82 48 
            L 40 48 
            C 28 48 22 42 22 30 
            L 22 20 
            Z
          "
          fillRule="evenodd"
        />

        {/* I */}
        <path
          d="
            M 130 20 L 196 20 L 196 46 L 176 46 L 176 84 L 196 84 L 196 110 L 130 110 L 130 84 L 150 84 L 150 46 L 130 46 Z
          "
        />

        {/* G */}
        <path
          d="
            M 234 20 
            L 294 20 
            L 294 46 
            L 246 46 
            L 246 84 
            L 272 84 
            L 272 65 
            L 256 65 
            L 256 46 
            L 294 46 
            L 294 100 
            C 294 106 288 110 282 110 
            L 234 110 
            C 222 110 214 102 214 90 
            L 214 40 
            C 214 28 222 20 234 20 
            Z
          "
        />

        {/* N */}
        <path
          d="
            M 314 20 
            L 338 20 
            L 378 80 
            L 378 20 
            L 402 20 
            L 402 110 
            L 378 110 
            L 338 50 
            L 338 110 
            L 314 110 
            Z
          "
        />

        {/* I */}
        <path
          d="
            M 420 20 L 486 20 L 486 46 L 466 46 L 466 84 L 486 84 L 486 110 L 420 110 L 420 84 L 440 84 L 440 46 L 420 46 Z
          "
        />

        {/* F */}
        <path
          d="
            M 504 20 
            L 570 20 
            L 570 46 
            L 530 46 
            L 530 58 
            L 564 58 
            L 564 82 
            L 530 82 
            L 530 110 
            L 504 110 
            Z
          "
        />

        {/* Y */}
        <path
          d="
            M 588 20 
            L 614 20 
            L 634 56 
            L 654 20 
            L 680 20 
            L 646 80 
            L 646 110 
            L 622 110 
            L 622 80 
            Z
          "
        />
      </g>
    </svg>
  );
};

/**
 * Unified SignifyLogo component supporting all variants.
 */
export const SignifyLogo: React.FC<SignifyLogoProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'icon',
  color = '#FF4D26',
  glow = false,
  withContainer = true,
  alt,
}) => {
  if (variant === 'wordmark') {
    return <SignifyWordmark className={className} color={color} />;
  }

  if (variant === 'combo') {
    return (
      <div className={`inline-flex items-center space-x-2.5 ${className}`}>
        <SignifyIcon size={size || 36} color={color} glow={glow} withContainer={withContainer} alt={alt} />
        <SignifyWordmark className="h-6 w-auto" color={color} />
      </div>
    );
  }

  // Default: ASL ILY Hand logo
  return (
    <SignifyIcon
      className={className}
      size={size}
      color={color}
      glow={glow}
      withContainer={withContainer}
      alt={alt}
    />
  );
};
