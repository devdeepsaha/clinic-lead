import React from 'react';

export default function AnalyticsHeader({ stats }) {
  const items = [
    { label: 'Total',     val: stats.total,     sub: 'ALL',   color: 'text-slate-900',   bg: 'bg-white' },
    { label: 'Tagged',    val: stats.tagged,    sub: `${stats.pct}%`, color: 'text-emerald-600', bg: 'bg-white' },
    { label: 'Message',   val: stats.message,   sub: 'MSG',   color: 'text-primary',     bg: 'bg-white' },
    { label: 'Call',      val: stats.call,      sub: 'CALL',  color: 'text-emerald-600', bg: 'bg-white' },
    { label: 'Replied',   val: stats.replied,   sub: 'REPLY', color: 'text-emerald-600', bg: 'bg-white', icon: 'mark_email_read' },
    { label: 'Untagged',  val: stats.unset,     sub: 'WAIT',  color: 'text-slate-900',   bg: 'bg-primary/5', icon: 'hourglass_empty' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 select-text">
      {items.map((item, i) => (
        <div key={i} className={`${item.bg} rounded-xl border border-slate-200 p-4 shadow-sm transition-all hover:shadow-md`}>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.label}</p>
          <div className="flex items-end justify-between mt-1.5">
            <h3 className={`text-2xl font-black ${item.color}`}>{item.val || '0'}</h3>
            {item.icon ? (
              <span className="material-symbols-outlined text-slate-400 opacity-50" style={{ fontSize: '18px' }}>{item.icon}</span>
            ) : (
              <span className="text-primary text-[10px] font-black bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">{item.sub}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}