import React, { useMemo, useState } from 'react';

const COUNTRY_FLAGS = {
  India:     '🇮🇳',
  UAE:       '🇦🇪',
  Australia: '🇦🇺',
};

const REGION_COLOR_MAP = {
  Dubai:        '#f59e0b',
  Sydney:       '#0ea5e9',
  NSW:          '#3b82f6',
  Bhopal:       '#f97316',
  Chhattisgarh: '#10b981',
};

export default function DatabaseBreakdown({ leads }) {
  const [activeTab, setActiveTab] = useState('categories');

  const data = useMemo(() => {
    const catCounts    = {};
    const ratings      = { high: 0, mid: 0, low: 0, unrated: 0 };
    const regionCounts = {};
    const countryCounts = {};

    leads.forEach(l => {
      // categories
      const cat = l.category || 'Uncategorized';
      if (!catCounts[cat]) catCounts[cat] = { total: 0, tagged: 0 };
      catCounts[cat].total += 1;
      if (l.status !== 'none') catCounts[cat].tagged += 1;

      // ratings
      const r = parseFloat(l.rating);
      if (!r)       ratings.unrated += 1;
      else if (r >= 4.5) ratings.high += 1;
      else if (r >= 3.5) ratings.mid  += 1;
      else               ratings.low  += 1;

      // regions
      const reg = l.region || 'Unknown';
      if (!regionCounts[reg]) regionCounts[reg] = { total: 0, tagged: 0, country: l.country || 'Unknown' };
      regionCounts[reg].total += 1;
      if (l.status !== 'none') regionCounts[reg].tagged += 1;

      // countries
      const country = l.country || 'Unknown';
      if (!countryCounts[country]) countryCounts[country] = { total: 0, tagged: 0 };
      countryCounts[country].total += 1;
      if (l.status !== 'none') countryCounts[country].tagged += 1;
    });

    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);

    const topRegions  = Object.entries(regionCounts).sort((a, b) => b[1].total - a[1].total);
    const topCountries = Object.entries(countryCounts).sort((a, b) => b[1].total - a[1].total);

    return { topCats, ratings, topRegions, topCountries };
  }, [leads]);

  const getProgressColor = (pct) => {
    if (pct >= 80) return '#10b981';
    if (pct >= 40) return '#f59e0b';
    if (pct > 0)   return '#ef4444';
    return '#cbd5e1';
  };

  const catMax     = data.topCats[0]     ? data.topCats[0][1].total     : 1;
  const regionMax  = data.topRegions[0]  ? data.topRegions[0][1].total  : 1;
  const ratingMax  = Math.max(data.ratings.high, data.ratings.mid, data.ratings.low, 1);

  const tabs = ['categories', 'regions', 'quality'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex-1 hidden lg:block select-text min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="material-symbols-outlined text-slate-300" style={{fontSize: '20px'}}>monitoring</span>
      </div>

      <div className="flex-1">

        {/* ── Categories tab ── */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {data.topCats.map(([name, stats], i) => {
              const taggedPct    = Math.round((stats.tagged / stats.total) * 100);
              const dynamicColor = getProgressColor(taggedPct);
              return (
                <div key={i} className="group">
                  <div className="flex justify-between text-xs mb-1.5 items-end">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 truncate max-w-[180px] leading-tight">{name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: dynamicColor }}>
                        {taggedPct}% Processed
                      </span>
                    </div>
                    <span className="font-black text-slate-900">{stats.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-slate-200 rounded-full absolute top-0 left-0 transition-all duration-1000"
                      style={{ width: `${(stats.total / catMax) * 100}%` }} />
                    <div className="h-full rounded-full absolute top-0 left-0 transition-all duration-1000 delay-300 shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                      style={{ width: `${(stats.tagged / catMax) * 100}%`, backgroundColor: dynamicColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Regions tab ── */}
        {activeTab === 'regions' && (
          <div className="space-y-3">
            {/* Country summary pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {data.topCountries.map(([country, stats]) => (
                <div key={country} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-lg">{COUNTRY_FLAGS[country] || '🌐'}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{country}</p>
                    <p className="text-xs font-bold text-slate-900">{stats.total.toLocaleString()} leads</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Per-region bars */}
            {data.topRegions.map(([region, stats], i) => {
              const taggedPct    = Math.round((stats.tagged / stats.total) * 100);
              const color        = REGION_COLOR_MAP[region] || '#94a3b8';
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{COUNTRY_FLAGS[stats.country] || '🌐'}</span>
                      <span className="font-black text-slate-700">{region}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{stats.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold" style={{ color }}>{taggedPct}%</span>
                      <span className="font-black text-slate-900">{stats.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(stats.total / regionMax) * 100}%`, backgroundColor: color, opacity: 0.3 }} />
                    <div className="h-full rounded-full transition-all duration-700 -mt-2"
                      style={{ width: `${(stats.tagged / regionMax) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Quality tab ── */}
        {activeTab === 'quality' && (
          <div className="flex flex-col h-full justify-around py-2">
            {[
              { label: 'Elite (4.5+ ★)',      count: data.ratings.high,    color: '#10b981' },
              { label: 'Solid (3.5-4.4 ★)',   count: data.ratings.mid,     color: '#3b82f6' },
              { label: 'Standard (< 3.5 ★)', count: data.ratings.low,     color: '#f59e0b' },
              { label: 'Unrated',             count: data.ratings.unrated, color: '#94a3b8' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: r.color, opacity: 0.3 }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{r.label}</span>
                    <span className="text-sm font-black text-slate-900">{r.count}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(r.count / ratingMax) * 100}%`, backgroundColor: r.color }} />
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
            ? 'Colors shift from red to emerald as you process more leads in a category.'
            : activeTab === 'regions'
            ? 'Leads span India, UAE, and Australia. Click a region pill in Directory to filter.'
            : 'Quality distribution helps prioritize high-rated business leads.'}
        </p>
      </div>
    </div>
  );
}