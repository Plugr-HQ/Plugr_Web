import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  isLoading: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({ isLoading }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [fadeWithStyle, setFadeWithStyle] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setFadeWithStyle(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      // Inline style used here to ensure exact hex color matching without custom Tailwind config edits
      style={{ backgroundColor: '#F5F1EC' }}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        fadeWithStyle ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Your Pulsing Logo */}
      <img 
        src="/logo.svg" 
        alt="Plugr Logo" 
        className="w-32 h-32 animate-pulse" 
      />
    </div>
  );
};