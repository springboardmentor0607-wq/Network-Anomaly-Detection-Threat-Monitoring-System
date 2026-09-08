"use client";

import React from 'react';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = "100%",
  height = "100%",
  borderRadius = 999,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-300 ${className}`}
      style={{
        ...style,
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: `${borderRadius}px`,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 0 rgba(255, 255, 255, 0.02),
          0 8px 32px rgba(0, 0, 0, 0.4)
        `,
      }}
    >
      <div className="w-full h-full flex items-center justify-center relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
