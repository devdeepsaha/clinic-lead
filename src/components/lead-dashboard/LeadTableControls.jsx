import React, { useState } from 'react';

export default function LeadTableControls({
  isAdmin, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  catFilter, setCatFilter, sortType, setSortType, setPage, perPage, setPerPage,
  copyMode, setCopyMode, categories, totalLeads, filteredCount,
  rangeFilters, setRangeFilters 
}) {
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [sortDropOpen, setSortDropOpen] = useState(false);
  const [filterDropOpen, setFilterDropOpen] = useState(false); 

  const MAX_REVIEWS_SLIDER = 5000;

  const handleRangeChange = (key, value) => {
    let parsed = parseFloat(value);
    if (isNaN(parsed)) parsed = 0;
    
    setRangeFilters(prev => {
      let next = { ...prev, [key]: parsed };
      if (key === 'ratingMin' && next.ratingMin > next.ratingMax) next.ratingMax = next.ratingMin;
      if (key === 'ratingMax' && next.ratingMax < next.ratingMin) next.ratingMin = next.ratingMax;
      if (key === 'reviewsMin' && next.reviewsMin > next.reviewsMax) next.reviewsMax = next.reviewsMin;
      if (key === 'reviewsMax' && next.reviewsMax < next.reviewsMin) next.reviewsMin = next.reviewsMax;
      return next;
    });
    setPage(1);
  };

  const applyQuickFilter = (type) => {
    if (type === 'high_rating') setRangeFilters({ ratingMin: 4.5, ratingMax: 5, reviewsMin: 0, reviewsMax: MAX_REVIEWS_SLIDER });
    if (type === 'low_reviews') setRangeFilters({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 100 });
    if (type === 'sweet_spot') setRangeFilters({ ratingMin: 3.5, ratingMax: 4.5, reviewsMin: 50, reviewsMax: 500 });
    if (type === 'reset') setRangeFilters({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: MAX_REVIEWS_SLIDER });
    setPage(1);
  };

  const isFilterActive = rangeFilters.ratingMin > 0 || rangeFilters.ratingMax < 5 || rangeFilters.reviewsMin > 0 || rangeFilters.reviewsMax < MAX_REVIEWS_SLIDER;

  return (
    <div className="px-4 md:px-6 py-3 md:py-4 bg-white md:border-b border-primary/10 sticky top-0 z-20 shadow-sm md:shadow-none">
      
      {/* Mobile Search Bar */}
      <div className="md:hidden flex items-stretch rounded-xl shadow-sm h-11 mb-3 relative">
        <div className="flex items-center justify-center pl-4 bg-white rounded-l-xl border border-r-0 border-primary/15">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>search</span>
        </div>
        <input 
          type="text" 
          placeholder="Search leads (Press 'C' to clear)..." 
          className="flex-1 bg-white border border-l-0 border-primary/15 rounded-r-xl px-3 pr-10 text-sm outline-none focus:border-primary/40 placeholder:text-slate-400" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)} 
        />
        {/* RECENTLY CHANGED: Added clear (x) button to the mobile search input */}
        {searchQuery && (
          <button 
            type="button"
            onClick={() => setSearchQuery('')} 
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="hidden md:block">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              Lead Directory {!isAdmin && <span className="material-symbols-outlined text-slate-300 text-lg">lock</span>}
            </h1>
            <div className="flex bg-slate-100 rounded-lg p-1 ml-2">
              <button className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${copyMode === 'email' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => setCopyMode('email')}>Email</button>
              <button className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${copyMode === 'whatsapp' ? 'bg-[#25D366] shadow text-white' : 'text-slate-400 hover:text-slate-600'}`} onClick={() => setCopyMode('whatsapp')}>WhatsApp</button>
            </div>
          </div>
          {/* RECENTLY CHANGED: Updated the subtitle description to match the new tags */}
          <p className="text-xs text-slate-500 mt-0.5">{filteredCount} results · tag each as Message, Call, Skip, Dismissed, or Replied.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          
          <div className="md:hidden flex bg-slate-100 rounded-lg p-1 mb-1">
            <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${copyMode === 'email' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`} onClick={() => setCopyMode('email')}>Email</button>
            <button className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${copyMode === 'whatsapp' ? 'bg-[#25D366] shadow-sm text-white' : 'text-slate-400'}`} onClick={() => setCopyMode('whatsapp')}>WhatsApp</button>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-0 md:border md:border-primary/15 md:rounded-lg">
            {/* RECENTLY CHANGED: Replaced old tags with all, message, call, skip, dismissed, replied and simplified label logic */}
            {['all', 'message', 'call', 'skip', 'dismissed', 'replied'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`flex-shrink-0 h-8 md:h-auto px-4 md:px-3 md:py-1.5 text-xs font-bold transition-all rounded-full md:rounded-none md:border-r md:last:border-r-0 border-primary/15 ${
                  statusFilter === s 
                    ? 'bg-primary text-white border-transparent md:border-primary/15' 
                    : 'text-slate-500 bg-white border border-primary/15 md:border-transparent hover:bg-primary/5'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            
            <div className="relative flex-1 md:flex-none">
              <button onClick={() => { setFilterDropOpen(!filterDropOpen); setCatDropOpen(false); setSortDropOpen(false); }} className={`w-full flex items-center justify-between md:justify-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-all ${isFilterActive ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 bg-white hover:border-primary/40'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>tune</span>
                <span className="hidden md:inline">Filters</span>
                {isFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-primary absolute top-1 right-1 animate-pulse"></span>}
              </button>

              {filterDropOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-[280px] max-w-[85vw] bg-white border border-primary/15 rounded-xl shadow-xl p-4 cursor-default">
                  
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>tune</span>
                      Advanced Filters
                    </h4>
                    <button onClick={() => applyQuickFilter('reset')} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">Reset All (R)</button>
                  </div>

                  <div className="mb-5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-amber-400 fill-1" style={{ fontSize: '14px' }}>star</span> Rating
                      </label>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {rangeFilters.ratingMin} - {rangeFilters.ratingMax}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 w-6">MIN</span>
                        <input type="range" min="0" max="5" step="0.1" value={rangeFilters.ratingMin} onChange={(e) => handleRangeChange('ratingMin', e.target.value)} className="flex-1 accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 w-6">MAX</span>
                        <input type="range" min="0" max="5" step="0.1" value={rangeFilters.ratingMax} onChange={(e) => handleRangeChange('ratingMax', e.target.value)} className="flex-1 accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-blue-400 fill-1" style={{ fontSize: '14px' }}>reviews</span> Reviews
                      </label>
                      <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {rangeFilters.reviewsMin} - {rangeFilters.reviewsMax === MAX_REVIEWS_SLIDER ? `${MAX_REVIEWS_SLIDER}+` : rangeFilters.reviewsMax}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 w-6">MIN</span>
                        <input type="range" min="0" max={MAX_REVIEWS_SLIDER} step="50" value={rangeFilters.reviewsMin} onChange={(e) => handleRangeChange('reviewsMin', e.target.value)} className="flex-1 accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 w-6">MAX</span>
                        <input type="range" min="0" max={MAX_REVIEWS_SLIDER} step="50" value={rangeFilters.reviewsMax} onChange={(e) => handleRangeChange('reviewsMax', e.target.value)} className="flex-1 accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => applyQuickFilter('high_rating')} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors">4.5+ Stars</button>
                    <button onClick={() => applyQuickFilter('sweet_spot')} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100 hover:bg-blue-100 transition-colors">Sweet Spot (S)</button>
                    <button onClick={() => applyQuickFilter('low_reviews')} className="px-2.5 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-100 hover:bg-amber-100 transition-colors">&lt; 100 Rev</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1 md:flex-none">
              <button onClick={() => { setCatDropOpen(!catDropOpen); setSortDropOpen(false); setFilterDropOpen(false); }} className="w-full flex items-center justify-between md:justify-center gap-1.5 h-8 px-3 rounded-lg border border-primary/15 bg-white text-xs font-semibold hover:border-primary/40 transition-all">
                <span className="material-symbols-outlined text-primary md:hidden" style={{ fontSize: '15px' }}>category</span>
                <span>{catFilter === 'all' ? 'Category' : (catFilter.length > 8 ? catFilter.slice(0,8)+'...' : catFilter)}</span>
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
              </button>
              {catDropOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 mt-1 z-50 min-w-[200px] max-h-80 overflow-y-auto bg-white border border-primary/15 rounded-xl shadow-lg">
                  <div onClick={() => { setCatFilter('all'); setCatDropOpen(false); setPage(1); }} className={`p-2 text-sm cursor-pointer flex justify-between ${catFilter === 'all' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                    All Categories <span className="opacity-50 text-xs">{totalLeads}</span>
                  </div>
                  {categories.map(([c, count]) => (
                    <div key={c} onClick={() => { setCatFilter(c); setCatDropOpen(false); setPage(1); }} className={`p-2 text-sm cursor-pointer flex justify-between ${catFilter === c ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>
                      {c} <span className="opacity-50 text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 md:flex-none">
              <button onClick={() => { setSortDropOpen(!sortDropOpen); setCatDropOpen(false); setFilterDropOpen(false); }} className="w-full flex items-center justify-between md:justify-center gap-1.5 h-8 px-3 rounded-lg border border-primary/15 bg-white text-xs font-semibold hover:border-primary/40 transition-all">
                <span className="hidden md:inline material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>sort</span>
                <span>Sort: {sortType === 'default' ? 'Default' : sortType.split('_')[0].toUpperCase()}</span>
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '15px' }}>expand_more</span>
              </button>
              {sortDropOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 w-48 bg-white border border-primary/15 rounded-xl shadow-lg flex flex-col p-1 text-sm">
                  {[{ id: 'default', label: 'Default Order' }, { id: 'name_asc', label: 'Name A → Z' }, { id: 'rating_desc', label: 'Highest Rated' }, { id: 'reviews_desc', label: 'Most Reviews' }, { id: 'cat_name', label: 'Category → Name' }].map(opt => (
                    <button key={opt.id} onClick={() => { setSortType(opt.id); setSortDropOpen(false); setPage(1); }} className={`text-left px-3 py-2 rounded-lg ${sortType === opt.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-primary/5'}`}>{opt.label}</button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}