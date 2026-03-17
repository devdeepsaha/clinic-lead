import React from 'react';

export default function Sidebar({ collapsed, setCollapsed, activeView, setActiveView, navItems }) {
  return (
    <aside 
      className={`hidden lg:flex flex-col border-r border-primary/10 bg-white transition-all duration-300`} 
      style={{ width: collapsed ? '72px' : '240px' }}
    >
      <div className="flex items-center justify-center p-4">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined">{collapsed ? 'side_navigation' : 'menu_open'}</span>
        </button>
      </div>
      <nav className="flex flex-col gap-2 px-3 mt-2">
        {navItems.map(item => (
          <a 
            key={item.id} 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveView(item.id); }} 
            className={`flex items-center rounded-xl transition-all duration-200 ${collapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4 py-3 gap-3'} ${activeView === item.id ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-primary/5'}`}
          >
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '22px' }}>{item.icon}</span>
            {!collapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
}