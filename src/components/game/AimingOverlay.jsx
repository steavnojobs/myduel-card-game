import React from 'react';

const AimingOverlay = ({ startPos, currentPos }) => {
  if (!startPos || !currentPos) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 点線 (赤色で狙ってる感！) */}
        <line 
          x1={startPos.x} 
          y1={startPos.y} 
          x2={currentPos.x} 
          y2={currentPos.y} 
          stroke="#ef4444" 
          strokeWidth="4" 
          strokeDasharray="10,10" 
          className="animate-pulse"
          filter="url(#glow)"
        />

        {/* 先端の二重丸 (ターゲットサイト) */}
        <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
          {/* 外側の回転する円 */}
          <circle r="20" fill="none" stroke="#ef4444" strokeWidth="3" className="animate-spin-slow opacity-80" />
          {/* 内側の円 */}
          <circle r="12" fill="none" stroke="#ef4444" strokeWidth="3" />
          {/* 中心の点 */}
          <circle r="4" fill="#ef4444" />
        </g>
      </svg>
    </div>
  );
};

export default AimingOverlay;