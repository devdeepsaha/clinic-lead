import React from 'react';

// RECENTLY CHANGED: Removed local state and localStorage logic. 
// Now it receives outreachLog directly from the Dashboard and uses setOutreachLog to update it.
export default function OutreachLog({ leads = [], outreachLog = [], setOutreachLog }) {
  
  const clearAll = () => {
    if (!window.confirm("Delete all outreach history?")) return;
    setOutreachLog([]); // This will automatically trigger syncToCloud from the Dashboard
  };

  const deleteEntry = (index) => {
    const newLog = [...outreachLog];
    newLog.splice(index, 1);
    setOutreachLog(newLog); // This will automatically trigger syncToCloud from the Dashboard
  };

  // Date formatting helpers
  const isSameDay = (ts1, ts2) => {
    const d1 = new Date(ts1), d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    if (isSameDay(ts, Date.now())) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isSameDay(ts, Date.now() - 86400000)) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const tplLabels = { job: "Job", build_no_demo: "Build", build_demo: "Build+" };
  const tplColors = {
    job: "bg-[#43aa8b]/15 text-[#43aa8b]",
    build_no_demo: "bg-primary/10 text-primary",
    build_demo: "bg-[#577590]/15 text-[#577590]"
  };

  return (
    <div id="view-outreach" className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Outreach History</h1>
        <p className="text-sm text-slate-500">
          A log of all messages copied via the quick-copy button in the lead directory.
        </p>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>mark_email_read</span>
            <h3 className="font-bold text-sm">Outreach Sent</h3>
          </div>
          <div className="flex items-center gap-3">
            {outreachLog.length > 0 && (
              <button 
                onClick={clearAll} 
                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>delete_sweep</span>
                Clear all
              </button>
            )}
            <span className="text-[10px] font-bold text-slate-400">{outreachLog.length} sent</span>
          </div>
        </div>
        
        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
          {outreachLog.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-symbols-outlined block text-4xl mb-2">mark_email_read</span>
              <p className="text-sm font-semibold">No outreach sent yet</p>
              <p className="text-xs mt-1">Copy a template from the lead directory to log it here</p>
            </div>
          ) : (
            outreachLog.slice(0, 100).map((e, i) => {
              const lead = leads.find((l) => l.id === e.id);
              const replied = lead?.replied;
              
              return (
                <div key={`${e.id}-${e.ts}-${i}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                    {e.name ? e.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{e.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{e.category}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${tplColors[e.tplKey] || "bg-slate-100 text-slate-500"}`}>
                    {tplLabels[e.tplKey] || e.tplKey}
                  </span>
                  
                  {replied ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">
                      <span className="material-symbols-outlined fill-1" style={{ fontSize: '12px' }}>mark_email_read</span>
                      Replied
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 flex-shrink-0">—</span>
                  )}
                  
                  <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 w-16 text-right">
                    {formatDate(e.ts)}
                  </span>
                  <button 
                    onClick={() => deleteEntry(i)} 
                    title="Delete" 
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}