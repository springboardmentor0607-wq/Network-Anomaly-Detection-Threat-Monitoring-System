import React from 'react';

const Skeleton = ({ className = '', height = 'h-6', width = 'w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/60 rounded-md border border-slate-700/30 ${height} ${width} ${className}`} />
  );
};

export default Skeleton;
