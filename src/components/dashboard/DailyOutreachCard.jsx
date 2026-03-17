import React from 'react';

export default function DailyOutreachCard({ dailyTotal, dailyPct, counts, onOpenCalendar }) {
  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm cursor-pointer hover:border-primary/40 transition-all group select-text" 
      onClick={onOpenCalendar}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">Today's Outreach</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
        <span className="material-symbols-outlined text-primary/30 group-hover:text-primary transition-colors">calendar_month</span>
      </div>

      <div className="flex items-center gap-6">
        {/* SVG Progress Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '84px', height: '84px' }}>
          <svg width="84" height="84" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle 
              cx="42" 
              cy="42" 
              r="36" 
              fill="none" 
              stroke="#9855f6" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeDasharray="226" 
              strokeDashoffset={226 * (1 - dailyPct / 100)} 
              style={{ transform: 'rotate(-90deg)', transformOrigin: '42px 42px', transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} 
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900 leading-none">{dailyTotal}</span>
            <span className="text-[8px] font-bold uppercase text-slate-400 mt-0.5">Sent</span>
          </div>
        </div>

        {/* Counts Breakdown */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" /> Job
            </span>
            <span className="font-black text-slate-800">{counts.job || 0}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#9855f6]" /> Build
            </span>
            <span className="font-black text-slate-800">{counts.build_no_demo || 0}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Build+
            </span>
            <span className="font-black text-slate-800">{counts.build_demo || 0}</span>
          </div>
          
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000" 
              style={{ width: `${dailyPct}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}