import React, { useEffect, useState } from 'react';

// Helper to convert time strings (e.g. "9:30 AM") to a float (9.5) for the 24h bar graph
const timeToFloat = (t) => {
  if (!t) return NaN;
  let str = t.toLowerCase().replace(/[^0-9:apm]/g, '');
  let isPm = str.includes('pm');
  let isAm = str.includes('am');
  str = str.replace(/[apm]/g, '');
  
  let [h, m] = str.split(':');
  let hour = parseInt(h || 0, 10);
  let min = parseInt(m || 0, 10);
  
  if (isPm && hour < 12) hour += 12;
  if (isAm && hour === 12) hour = 0;
  
  return hour + (min / 60);
};

// Parses CSV hour strings into start/end intervals for the graph
const parseHours = (hoursStr) => {
  if (!hoursStr || hoursStr === 'Not specified') return { isOpen: false, isUnspecified: true, text: 'Not specified', intervals: [] };
  if (hoursStr.toLowerCase().includes('closed')) return { isOpen: false, isUnspecified: false, text: 'Closed', intervals: [] };
  if (hoursStr.toLowerCase().includes('24 hours')) return { isOpen: true, isUnspecified: false, text: '24 Hours', intervals: [{ start: 0, end: 24 }] };

  const parts = hoursStr.split(',').map(p => p.trim());
  const intervals = [];

  parts.forEach(part => {
    const times = part.split(/(?:[-–]| to )/i);
    if (times.length === 2) {
      const start = timeToFloat(times[0]);
      const end = timeToFloat(times[1]);
      
      if (!isNaN(start) && !isNaN(end)) {
        if (end < start) {
          intervals.push({ start, end: 24 });
          intervals.push({ start: 0, end });
        } else {
          intervals.push({ start, end });
        }
      }
    }
  });

  return { 
    isOpen: intervals.length > 0, 
    isUnspecified: false, 
    text: hoursStr, 
    intervals 
  };
};

export default function TimingModal({ lead, onClose }) {
  // RECENTLY CHANGED: Added state to track current time and day for the live needle and status pill
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update time every minute
    return () => clearInterval(timer);
  }, []);

  if (!lead) return null;

  const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday
  const currentHourFloat = now.getHours() + (now.getMinutes() / 60);

  const days = [
    { key: 'monday', label: 'Monday', index: 1 },
    { key: 'tuesday', label: 'Tuesday', index: 2 },
    { key: 'wednesday', label: 'Wednesday', index: 3 },
    { key: 'thursday', label: 'Thursday', index: 4 },
    { key: 'friday', label: 'Friday', index: 5 },
    { key: 'saturday', label: 'Saturday', index: 6 },
    { key: 'sunday', label: 'Sunday', index: 0 }
  ];

  // Check if business is open RIGHT NOW
  let isOpenNow = false;
  const todayObj = days.find(d => d.index === currentDayIndex);
  const todayParsed = parseHours(lead[todayObj.key]);
  
  if (todayParsed.isOpen && !todayParsed.isUnspecified) {
    isOpenNow = todayParsed.intervals.some(inv => currentHourFloat >= inv.start && currentHourFloat <= inv.end);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* RECENTLY CHANGED: Injected the custom CSS variables for the premium glass and track effects */}
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .time-track-bg {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 999px;
          height: 8px;
          position: relative;
        }
        .time-track-active {
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 999px;
          height: 100%;
          position: absolute;
        }
        .time-needle {
          width: 2px;
          height: 16px;
          background: #ef4444;
          position: absolute;
          top: -4px;
          border-radius: 1px;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
          z-index: 10;
        }
      `}</style>

      {/* RECENTLY CHANGED: Updated container to match the exact Tailwind structure provided */}
      <div className="glass-effect w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col gap-8 scale-in-95">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Business Hours</p>
            </div>
          </div>
          
          {/* RECENTLY CHANGED: Dynamic Status Pill based on current time calculation */}
          {isOpenNow ? (
            <div className="flex items-center justify-center gap-2 bg-emerald-100 px-4 py-2 rounded-full border border-emerald-200 shadow-sm flex-shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-soft"></span>
              <span className="text-emerald-700 text-xs md:text-sm font-semibold tracking-wide uppercase">Open Now</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm flex-shrink-0">
              <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
              <span className="text-slate-600 text-xs md:text-sm font-semibold tracking-wide uppercase">Closed</span>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-5 md:gap-6">
          {/* RECENTLY CHANGED: Iterating through days to render custom tracking bars dynamically */}
          {days.map((day) => {
            const parsed = parseHours(lead[day.key]);
            const isToday = day.index === currentDayIndex;
            const isFaded = !parsed.isOpen && !parsed.isUnspecified;

            return (
              <div key={day.key} className={`grid grid-cols-12 items-center gap-2 md:gap-4 ${isFaded ? 'opacity-50' : ''}`}>
                <div className={`col-span-3 md:col-span-3 text-xs md:text-sm font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                  {day.label}
                </div>
                
                <div className="col-span-5 md:col-span-6 relative px-1 md:px-2">
                  <div className={`time-track-bg ${isFaded ? 'bg-slate-200' : ''}`}>
                    {parsed.intervals.map((inv, i) => (
                      <div 
                        key={i} 
                        className="time-track-active" 
                        style={{ left: `${(inv.start / 24) * 100}%`, width: `${((inv.end - inv.start) / 24) * 100}%` }}
                      ></div>
                    ))}
                    {/* Live red needle dropping on today's timeline based on your current time */}
                    {isToday && (
                      <div className="time-needle" style={{ left: `${(currentHourFloat / 24) * 100}%` }}></div>
                    )}
                  </div>
                </div>
                
                <div className={`col-span-4 md:col-span-3 text-right text-[10px] md:text-sm font-semibold truncate ${isFaded ? 'text-slate-400 uppercase tracking-wider' : 'text-slate-800'}`}>
                  {parsed.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* RECENTLY CHANGED: Converted dual actions into a single centered Close button to match viewer intent */}
        <footer className="flex items-center gap-4 mt-2">
          <button 
            onClick={onClose}
            className="w-full py-4 px-6 rounded-[24px] bg-slate-100 text-slate-600 font-semibold text-sm transition-all hover:bg-slate-200 active:scale-95"
          >
            Close Viewer
          </button>
        </footer>

      </div>
    </div>
  );
}