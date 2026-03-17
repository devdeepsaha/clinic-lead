import React from 'react';

export default function MobileNav({ activeView, setActiveView, navItems }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-primary/10 bg-white px-4 pb-safe pt-2 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center max-w-lg mx-auto pb-1">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveView(item.id)} 
            className={`flex flex-col items-center gap-0.5 pt-1 transition-colors duration-200 ${
              activeView === item.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span 
              className={`material-symbols-outlined transition-transform duration-200 ${
                activeView === item.id ? 'fill-1 scale-110' : ''
              }`} 
              style={{ fontSize: '24px' }}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] font-bold ${activeView === item.id ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}