import React from 'react';

interface QuantaraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const QuantaraLogoMark: React.FC<QuantaraLogoProps> = ({
  size = 'md',
  className = '',
  showGlow = true,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {showGlow && (
        <div
          className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-indigo-600/30 blur-sm -z-10"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id="quantara-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16161A" />
            <stop offset="50%" stopColor="#101013" />
            <stop offset="100%" stopColor="#0A0A0C" />
          </linearGradient>

          {/* Border Metallic Stroke */}
          <linearGradient id="quantara-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
            <stop offset="35%" stopColor="#2563EB" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#1E293B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.6" />
          </linearGradient>

          {/* Primary Q Ring Gradient */}
          <linearGradient id="quantara-primary" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="30%" stopColor="#3B82F6" />
            <stop offset="70%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Execution Vector Slash Gradient */}
          <linearGradient id="quantara-vector" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          {/* Inner Glow Filter */}
          <filter id="quantara-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Outer Squircle Container Frame */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="24"
          fill="url(#quantara-bg)"
          stroke="url(#quantara-border)"
          strokeWidth="1.75"
        />

        {/* Corner Precision Calibration Crosshairs */}
        <line x1="12" y1="18" x2="18" y2="18" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="18" y1="12" x2="18" y2="18" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.5" />

        <line x1="82" y1="18" x2="88" y2="18" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="82" y1="12" x2="82" y2="18" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.5" />

        <line x1="12" y1="82" x2="18" y2="82" stroke="#06B6D4" strokeWidth="1" strokeOpacity="0.5" />
        <line x1="18" y1="82" x2="18" y2="88" stroke="#06B6D4" strokeWidth="1" strokeOpacity="0.5" />

        {/* Concentric Telemetry Orbit Arc (Upper Right & Lower Left) */}
        <path
          d="M 50 18 A 32 32 0 0 1 82 50"
          stroke="#60A5FA"
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="2 3"
        />
        <path
          d="M 50 82 A 32 32 0 0 1 18 50"
          stroke="#06B6D4"
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="2 3"
        />

        {/* Main Quantum "Q" Geometry: Sleek Beveled Torus */}
        <path
          d="M 50 25
             C 63.8 25 75 36.2 75 50
             C 75 56.4 72.7 62.2 68.9 66.8
             L 62.4 60.3
             C 64.9 57.3 66.5 53.8 66.5 50
             C 66.5 40.9 59.1 33.5 50 33.5
             C 40.9 33.5 33.5 40.9 33.5 50
             C 33.5 59.1 40.9 66.5 50 66.5
             C 53.8 66.5 57.3 64.9 60.3 62.4
             L 66.8 68.9
             C 62.2 72.7 56.4 75 50 75
             C 36.2 75 25 63.8 25 50
             C 25 36.2 36.2 25 50 25 Z"
          fill="url(#quantara-primary)"
        />

        {/* Dynamic Execution Vector (The "Q" Terminal Slash) */}
        {/* Cuts through the lower-right opening and points at 45° with an institutional arrow wedge */}
        <path
          d="M 46 52
             L 52 46
             L 78 72
             L 84 66
             L 85 85
             L 66 84
             L 72 78
             Z"
          fill="url(#quantara-vector)"
          filter="url(#quantara-glow)"
        />

        {/* Apex Signal Node */}
        <circle cx="83" cy="83" r="3" fill="#38BDF8" />
        <circle cx="83" cy="83" r="1.5" fill="#FFFFFF" />

        {/* Core Quantum Singularity Node */}
        <circle cx="50" cy="50" r="3.5" fill="#3B82F6" fillOpacity="0.85" />
        <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export const QuantaraBrand: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}> = ({ size = 'md', showTagline = true, className = '' }) => {
  return (
    <div className={`flex items-center space-x-3.5 ${className}`}>
      <QuantaraLogoMark size={size} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center space-x-2.5">
          <span className="font-brand text-lg font-extrabold tracking-[0.18em] text-white flex items-center leading-none">
            QUANT<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">ARA</span>
          </span>
          <span className="rounded border border-blue-500/25 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-tech font-bold uppercase tracking-wider text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] leading-none">
            INSTITUTIONAL
          </span>
        </div>
        {showTagline && (
          <p className="text-[10px] text-[#8E9299] tracking-wider uppercase font-medium font-tech hidden sm:flex items-center space-x-1.5 mt-1 leading-none">
            <span>Intelligent Trading</span>
            <span className="text-blue-500/70">•</span>
            <span>Automated Execution</span>
          </p>
        )}
      </div>
    </div>
  );
};
