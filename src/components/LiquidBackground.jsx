import React from 'react';

/**
 * Clean, subtle, modern dark background
 * Eliminates noisy colorful gradient blobs in favor of a sleek obsidian studio aesthetic
 */
export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#08090d]">
      {/* Subtle top ambient illumination */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] opacity-40 filter blur-[120px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(118, 185, 0, 0.08) 0%, rgba(30, 41, 59, 0.15) 50%, transparent 75%)'
        }}
      />
      {/* Subtle bottom vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(15,23,42,0.15),transparent_70%)]" />
    </div>
  );
}
