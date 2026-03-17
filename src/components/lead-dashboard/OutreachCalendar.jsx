import React, { useState, useMemo } from 'react';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OutreachCalendar({ isOpen, onClose, outreachLog = [], onDeleteEntry }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(getLocalDateString());

  // Logic: Map outreach to date keys for dots
  const dailyHistory = useMemo(() => {
    const history = {};
    outreachLog.forEach(entry => {
      const key = getLocalDateString(new Date(entry.ts));
      if (!history[key]) history[key] = { job: 0, build_no_demo: 0, build_demo: 0 };
      if (entry.tplKey === 'job') history[key].job++;
      else if (entry.tplKey === 'build_no_demo') history[key].build_no_demo++;
      else if (entry.tplKey === 'build_demo') history[key].build_demo++;
    });
    return history;
  }, [outreachLog]);

  // Logic: Selected Day Activity
  const selectedDayEntries = useMemo(() => {
    return outreachLog.filter(entry => getLocalDateString(new Date(entry.ts)) === selectedDayKey);
  }, [selectedDayKey, outreachLog]);

  // Logic: Monthly Performance Stats
  const monthlyStats = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    let job = 0, build = 0, buildPlus = 0;
    
    outreachLog.forEach(e => {
      const d = new Date(e.ts);
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (e.tplKey === 'job') job++;
        else if (e.tplKey === 'build_no_demo') build++;
        else if (e.tplKey === 'build_demo') buildPlus++;
      }
    });
    return { job, build, buildPlus, total: job + build + buildPlus };
  }, [outreachLog, currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  if (!isOpen) return null;

  return (
    <div 
      id="cal-backdrop"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-end"
      onClick={(e) => e.target.id === 'cal-backdrop' && onClose()}
    >
      <div className="w-full max-w-md bg-white h-screen shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
        {/* Header */}
        <header className="p-5 border-b border-slate-50">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Outreach Calendar
            </h1>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Month Navigation */}
          <div className="px-6 pt-5 flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="px-6 mb-8">
            <div className="grid grid-cols-7 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-t border-slate-50 mt-2">
              {/* Empty slots */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-transparent" />
              ))}
              
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const key = getLocalDateString(dateObj);
                const isSelected = selectedDayKey === key;
                const data = dailyHistory[key];

                return (
                  <button 
                    key={key}
                    onClick={() => setSelectedDayKey(key)}
                    className="aspect-square bg-transparent flex flex-col items-center justify-center gap-1 hover:bg-slate-50/50 transition-colors group relative"
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold text-primary' : 'font-medium text-slate-600'}`}>
                      {day}
                    </span>
                    
                    {/* Dots Container */}
                    <div className={`${isSelected ? 'absolute bottom-2' : ''} flex gap-0.5`}>
                      {data?.job > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                      {data?.build_no_demo > 0 && <div className="w-1 h-1 rounded-full bg-primary/60" />}
                      {data?.build_demo > 0 && <div className="w-1 h-1 rounded-full bg-sky-300" />}
                    </div>

                    {/* Active Underline */}
                    {isSelected && <div className="absolute inset-x-2 bottom-0 h-0.5 bg-primary"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Activity */}
          <div className="px-6 mb-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">
              Activity for {new Date(selectedDayKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </h3>
            <div className="space-y-3">
              {selectedDayEntries.length > 0 ? selectedDayEntries.map((entry) => (
                <div key={entry.ts} className="flex items-center gap-4 py-3 border-b border-slate-50 hover:bg-slate-50/30 transition-colors px-2 -mx-2 rounded-lg group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                    ${entry.tplKey === 'job' ? 'bg-emerald-50 text-emerald-500' : 
                      entry.tplKey === 'build_no_demo' ? 'bg-primary/5 text-primary/70' : 
                      'bg-sky-50 text-sky-400'}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {entry.tplKey === 'job' ? 'work' : entry.tplKey === 'build_no_demo' ? 'rocket_launch' : 'bolt'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{entry.name}</p>
                    <p className="text-[11px] text-slate-400 truncate uppercase">{entry.tplKey.replace(/_/g, ' ')}</p>
                  </div>
                  <button 
                    onClick={() => onDeleteEntry(entry.ts)}
                    className="p-1 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <p className="text-xs text-slate-400 italic">No activity recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer / Global Performance */}
        <footer className="p-6 bg-white border-t border-slate-50">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-5">
            Global Performance ({currentDate.toLocaleString('default', { month: 'short' })})
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-slate-400 uppercase">Total</span>
              <span className="text-lg font-semibold text-slate-900">{monthlyStats.total}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-emerald-500 uppercase">Jobs</span>
              <span className="text-lg font-semibold text-slate-900">{monthlyStats.job}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-primary uppercase">Builds</span>
              <span className="text-lg font-semibold text-slate-900">{monthlyStats.build}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium text-sky-400 uppercase">Adv.</span>
              <span className="text-lg font-semibold text-slate-900">{monthlyStats.buildPlus}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}