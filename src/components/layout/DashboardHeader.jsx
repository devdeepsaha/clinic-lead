import React from 'react';

export default function DashboardHeader({ 
  searchQuery, setSearchQuery, 
  dataMode, setDataMode, 
  isAdmin, handleToggleAdmin, 
  syncStatus, handleExportMarked, 
  setShowShortcutsHelp 
}) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between border-b border-primary/10 bg-white px-4 lg:px-6 py-3 z-30 shadow-sm">
      <div className="flex items-center gap-3 lg:gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">table_view</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm lg:text-lg font-black uppercase">LeadFlow</h2>
            <span className="text-[9px] font-bold text-primary uppercase hidden sm:block tracking-widest">Enterprise</span>
          </div>
        </div>
        
        {/* Desktop Search */}
        <div className="hidden lg:flex items-center gap-1 border-l border-primary/20 pl-6 ml-2 relative select-text">
          <span className="material-symbols-outlined absolute left-9 text-slate-400" style={{ fontSize: '18px' }}>search</span>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="h-10 w-80 rounded-lg border border-primary/15 bg-primary/5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all" 
            placeholder="Search (C to clear)..." 
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-700">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>

        {/* Data Source Toggle */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
          <span className="material-symbols-outlined text-slate-400" style={{fontSize: '16px'}}>database</span>
          <select 
            value={dataMode} 
            onChange={(e) => setDataMode(e.target.value)} 
            className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 cursor-pointer"
          >
            <option value="local">Local File</option>
            <option value="cloud">Cloud DB</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button 
          onClick={handleToggleAdmin} 
          className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center transition-all ${isAdmin ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
        >
          <span className="material-symbols-outlined">{isAdmin ? 'lock_open' : 'lock'}</span>
        </button>
        <button onClick={() => setShowShortcutsHelp(true)} className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] text-slate-500">
          <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="hidden sm:inline font-bold uppercase">{syncStatus}</span>
        </div>
        <button onClick={handleExportMarked} className="flex h-8 lg:h-10 items-center gap-2 rounded-lg bg-primary px-3 lg:px-4 text-[11px] lg:text-sm font-bold text-white shadow-md shadow-primary/25">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>ios_share</span>
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
}