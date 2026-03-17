import React, { useMemo, useState } from 'react';

export default function DatabaseBreakdown({ leads }) {
  const [activeTab, setActiveTab] = useState('categories');

  const data = useMemo(() => {
    const catCounts = {};
    const ratings = { high: 0, mid: 0, low: 0, unrated: 0 };
    
    leads.forEach(l => {
      const cat = l.category || "Uncategorized";
      if (!catCounts[cat]) {
        catCounts[cat] = { total: 0, tagged: 0 };
      }
      catCounts[cat].total += 1;
      if (l.status !== 'none') catCounts[cat].tagged += 1;

      const r = parseFloat(l.rating);
      if (!r) ratings.unrated += 1;
      else if (r >= 4.5) ratings.high += 1;
      else if (r >= 3.5) ratings.mid += 1;
      else ratings.low += 1;
    });

    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);

    return { topCats, ratings };
  }, [leads]);

  // RECENTLY CHANGED: Dynamic color function based on progress percentage
  const getProgressColor = (pct) => {
    if (pct >= 80) return '#10b981'; // Emerald (Done)
    if (pct >= 40) return '#f59e0b'; // Amber (In Progress)
    if (pct > 0) return '#ef4444';   // Red (Started)
    return '#cbd5e1';               // Slate (Not started)
  };

  const catMax = data.topCats[0] ? data.topCats[0][1].total : 1;
  const ratingMax = Math.max(data.ratings.high, data.ratings.mid, data.ratings.low, 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex-1 hidden lg:block select-text min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'categories' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === 'quality' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Quality
          </button>
        </div>
        <span className="material-symbols-outlined text-slate-300" style={{fontSize: '20px'}}>monitoring</span>
      </div>

      <div className="flex-1">
        {activeTab === 'categories' ? (
          <div className="space-y-6">
            {data.topCats.map(([name, stats], i) => {
              const taggedPct = Math.round((stats.tagged / stats.total) * 100);
              const dynamicColor = getProgressColor(taggedPct);
              
              return (
                <div key={i} className="group">
                  <div className="flex justify-between text-xs mb-1.5 items-end">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 truncate max-w-[180px] leading-tight">{name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter`} style={{ color: dynamicColor }}>
                        {taggedPct}% Processed
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900">{stats.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                    {/* Background "Total" Bar */}
                    <div 
                      className="h-full bg-slate-200 rounded-full absolute top-0 left-0 transition-all duration-1000" 
                      style={{ width: `${(stats.total / catMax) * 100}%` }}
                    />
                    {/* Foreground "Processed" Bar with Dynamic Color */}
                    <div 
                      className="h-full rounded-full absolute top-0 left-0 transition-all duration-1000 delay-300 shadow-[0_0_8px_rgba(0,0,0,0.1)]" 
                      style={{ 
                        width: `${(stats.tagged / catMax) * 100}%`,
                        backgroundColor: dynamicColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col h-full justify-around py-2">
            {[
              { label: 'Elite (4.5+ ★)', count: data.ratings.high, color: '#10b981', key: 'high' },
              { label: 'Solid (3.5-4.4 ★)', count: data.ratings.mid, color: '#3b82f6', key: 'mid' },
              { label: 'Standard (< 3.5 ★)', count: data.ratings.low, color: '#f59e0b', key: 'low' },
              { label: 'Unrated', count: data.ratings.unrated, color: '#94a3b8', key: 'unrated' }
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: r.color, opacity: 0.3 }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{r.label}</span>
                    <span className="text-sm font-black text-slate-900">{r.count}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700" 
                      style={{ 
                        width: `${(r.count / ratingMax) * 100}%`,
                        backgroundColor: r.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed italic">
          {activeTab === 'categories' 
            ? "Colors shift from red to emerald as you process more leads in a category." 
            : "Quality distribution helps prioritize high-rated business leads."}
        </p>
      </div>
    </div>
  );
}