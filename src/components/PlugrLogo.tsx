import React from 'react';

interface PlugrLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function PlugrLogo({ size = 'md', showText = true }: PlugrLogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-xl' },
    md: { icon: 'h-10 w-10', text: 'text-3xl' },
    lg: { icon: 'h-16 w-16', text: 'text-4xl' },
    xl: { icon: 'h-24 w-24', text: 'text-5xl' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Plugr Logo SVG */}
      <svg
        className={`${currentSize.icon} text-[#EB9E27]`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main plug circle */}
        <circle cx="50" cy="46" r="38" fill="currentColor" />
        
        {/* Left cutout representing plug prong slot */}
        <rect x="36" y="56" width="10" height="24" rx="5" fill="#F6F5F0" />
        
        {/* Right cutout representing plug prong slot */}
        <rect x="54" y="56" width="10" height="24" rx="5" fill="#F6F5F0" />
        
        {/* Rounded center notch like a friendly socket face or outlet keyway */}
        <rect x="45" y="32" width="10" height="18" rx="5" fill="#F6F5F0" className="opacity-90" />
      </svg>

      {showText && (
        <span className={`${currentSize.text} font-display font-bold tracking-tight text-[#181C25]`}>
          plugr
        </span>
      )}
    </div>
  );
}
