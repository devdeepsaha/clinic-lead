import React, { useMemo } from 'react';

export default function StatDonut({ pct, stats }) {
  // RECENTLY CHANGED: Moved path calculation inside the component for better isolation
  const donutPaths = useMemo(() => {
    if (!stats.total) return [];
    
    const polarToCartesian = (cx, cy, r, angleDeg) => {
      const rad = ((angleDeg - 90) * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const segments = [
      { count: stats.job, color: "#10b981" },      // Job
      { count: stats.build, color: "#9855f6" },    // Build
      { count: stats.buildPlus, color: "#3b82f6" }, // Build+
      { count: stats.skip, color: "#D3D3D3" },      // Skip/None
      { count: stats.dismissed, color: "#ef4444" }, // Dismissed
    ].filter(s => s.count > 0);

    // If only one category has data, just render a full circle
    if (segments.length === 1) return [{ d: null, singleColor: segments[0].color }];

    const gapAngle = 2; // Small gap between segments
    const totalGaps = segments.length * gapAngle;
    const availableAngle = 360 - totalGaps;

    let currentAngle = 0;
    return segments.map((seg) => {
      const angle = (seg.count / stats.total) * availableAngle;
      const start = polarToCartesian(80, 80, 60, currentAngle);
      const end = polarToCartesian(80, 80, 60, currentAngle + angle);
      const largeArc = angle > 180 ? 1 : 0;
      const d = `M ${start.x} ${start.y} A 60 60 0 ${largeArc} 1 ${end.x} ${end.y}`;
      currentAngle += angle + gapAngle;
      return { d, color: seg.color };
    });
  }, [stats]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col lg:col-span-1 lg:row-span-2 order-2 lg:order-1 select-text">
      <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-slate-400">Tagging Progress</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Donut Chart SVG */}
        <div className="relative" style={{ width: '160px', height: '160px' }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background Circle */}
            <circle cx="80" cy="80" r="60" fill="none" stroke="#f1f5f9" strokeWidth="16" />
            {/* Dynamic Segments */}
            {donutPaths.map((p, i) => (
              p.singleColor ? 
                <circle key={i} cx="80" cy="80" r="60" fill="none" stroke={p.singleColor} strokeWidth="16" /> :
                <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth="16" strokeLinecap="butt" />
            ))}
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-black text-slate-800 leading-none">{pct}%</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Tagged</span>
          </div>
        </div>

        {/* RESTORED: Legends Grid */}
        <div className="mt-6 w-full grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-bold">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#10b981' }}></span>Job
            </span>
            <span className="text-slate-800">{stats.job}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#9855f6' }}></span>Build
            </span>
            <span className="text-slate-800">{stats.build}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#3b82f6' }}></span>Build+
            </span>
            <span className="text-slate-800">{stats.buildPlus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#d3d3d3' }}></span>Skip
            </span>
            <span className="text-slate-800">{stats.skip}</span>
          </div>
          <div className="flex items-center justify-between col-span-2 pt-1 border-t border-slate-50">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#ef4444' }}></span>Dismissed
            </span>
            <span className="text-slate-800">{stats.dismissed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}