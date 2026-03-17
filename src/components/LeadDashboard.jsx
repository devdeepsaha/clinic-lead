import React, { useState } from 'react';
import DashboardAnalytics from './DashboardAnalytics';
import LeadTable from './lead-dashboard/LeadTable';
import OutreachLog from './OutreachLog';
import SettingsPanel from './SettingsPanel';
import OutreachCalendar from './lead-dashboard/OutreachCalendar';
import DashboardHeader from './layout/DashboardHeader';
import Sidebar from './layout/Sidebar';
import MobileNav from './layout/MobileNav';

export default function LeadDashboard(props) {
  const { 
    leads, setLeads, outreachLog, setOutreachLog, dailyData, setDailyData,
    isLoading, syncStatus, dataMode, setDataMode, dataSource, isAdmin, 
    adminKey, handleToggleAdmin, syncToCloud, showShortcutsHelp, setShowShortcutsHelp,
    searchQuery, setSearchQuery, page, setPage, rangeFilters, setRangeFilters,
    activeView, setActiveView,
    onOpenCalendar, // Prop from App.jsx if you use global state
    isCalendarOpen, // If App.jsx is managing visibility
    onCloseCalendar // If App.jsx is managing visibility
  } = props;

  // Local UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCalOpen, setIsCalOpen] = useState(false); // Local fallback if not in App.jsx
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [sortType, setSortType] = useState('default');
  const [perPage, setPerPage] = useState(15);
  const [copyMode, setCopyMode] = useState('email'); 
  const [selectedMapLead, setSelectedMapLead] = useState(null);

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Home' }, 
    { id: 'leads', icon: 'view_list', label: 'Directory' }, 
    { id: 'outreach', icon: 'mail', label: 'Log' }, 
    { id: 'settings', icon: 'settings', label: 'Setup' }
  ];

  // --- RECENTLY CHANGED: Sync-Aware Update Helpers ---
  
  const handleUpdateLeads = (newLeads) => { 
    setLeads(newLeads); 
    syncToCloud(newLeads, dailyData, outreachLog, adminKey); 
  };

  const handleUpdateDaily = (newDaily) => { 
    setDailyData(newDaily); 
    syncToCloud(leads, newDaily, outreachLog, adminKey); 
  };

  const handleUpdateOutreach = (newOutreach) => { 
    setOutreachLog(newOutreach); 
    syncToCloud(leads, dailyData, newOutreach, adminKey); 
  };

  // NEW: Deletes from log and pushes update to cloud to prevent "refresh-resurrection"
  const handleDeleteOutreach = (ts) => {
    const updatedLog = outreachLog.filter(entry => entry.ts !== ts);
    handleUpdateOutreach(updatedLog);
  };

  // --- UI Handlers ---

  const handleLocateOnMap = (lead) => {
    if (!lead.lat || !lead.lng) return alert("No coordinates found.");
    setSelectedMapLead({ ...lead, _triggerTime: Date.now() }); 
    setActiveView('dashboard');
  };

  const handleViewInDirectory = (lead) => {
    setSearchQuery(lead.name); 
    setStatusFilter('all'); 
    setCatFilter('all');
    setRangeFilters({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 5000 });
    setActiveView('leads'); 
    setPage(1);
  };

  const handleExportMarked = () => {
    const marked = leads.filter((l) => l.checked);
    if (!marked.length) return alert("No leads checked!");
    const header = ["Name", "Phone", "Website", "Email", "Category", "Rating", "Reviews", "Status"];
    const rows = marked.map((l) => [
      l.name, l.phone, l.website, l.email, l.category, l.rating, l.reviews, l.status
    ].map(v => `"${(v || "").toString().replace(/"/g, '""')}"`));
    
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `outreach_leads_${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
  };

  return (
    <div className="bg-background-light text-slate-900 font-display h-screen flex flex-col overflow-hidden relative">
      
      {/* Outreach Calendar Overlay */}
      <OutreachCalendar 
        isOpen={isCalendarOpen !== undefined ? isCalendarOpen : isCalOpen} 
        onClose={onCloseCalendar || (() => setIsCalOpen(false))} 
        outreachLog={outreachLog} 
        onDeleteEntry={handleDeleteOutreach} 
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/95 z-[9999] flex flex-col items-center justify-center gap-4 text-slate-500">
          <div className="spinner border-3 border-slate-200 border-t-primary rounded-full w-10 h-10 animate-spin" />
          <p className="text-sm font-semibold tracking-tight uppercase">Syncing Cloud Architecture...</p>
        </div>
      )}

      {/* Global Header */}
      <DashboardHeader 
        {...{ searchQuery, setSearchQuery, dataMode, setDataMode, isAdmin, handleToggleAdmin, syncStatus, handleExportMarked, setShowShortcutsHelp }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          activeView={activeView} 
          setActiveView={setActiveView} 
          navItems={navItems} 
        />

        {/* View Management */}
        <main className="flex-1 overflow-y-auto bg-background-light pb-20 lg:pb-0 w-full relative custom-scrollbar">
          
          {activeView === 'dashboard' && (
            <DashboardAnalytics 
              leads={leads} 
              dailyData={dailyData} 
              selectedMapLead={selectedMapLead} 
              dataSource={dataSource} 
              onViewInDirectory={handleViewInDirectory} 
              onOpenCalendar={onOpenCalendar || (() => setIsCalOpen(true))} 
            />
          )}

          {activeView === 'leads' && ( 
            <LeadTable 
              leads={leads} 
              isAdmin={isAdmin} 
              setLeads={handleUpdateLeads} 
              dailyData={dailyData} 
              setDailyData={handleUpdateDaily} 
              outreachLog={outreachLog} 
              setOutreachLog={handleUpdateOutreach} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              statusFilter={statusFilter} 
              setStatusFilter={setStatusFilter} 
              catFilter={catFilter} 
              setCatFilter={setCatFilter} 
              sortType={sortType} 
              setSortType={setSortType} 
              page={page} 
              setPage={setPage} 
              perPage={perPage} 
              setPerPage={setPerPage} 
              copyMode={copyMode} 
              setCopyMode={setCopyMode} 
              rangeFilters={rangeFilters} 
              setRangeFilters={setRangeFilters} 
              onLocate={handleLocateOnMap} 
            /> 
          )}
          
          {activeView === 'outreach' && (
            <OutreachLog 
              leads={leads} 
              outreachLog={outreachLog} 
              setOutreachLog={handleUpdateOutreach} 
            />
          )}

          {activeView === 'settings' && (
            <SettingsPanel 
              leads={leads} 
              isAdmin={isAdmin} 
              adminKey={adminKey} 
              setLeads={handleUpdateLeads} 
              dailyData={dailyData} 
              setDailyData={handleUpdateDaily} 
              syncStatus={syncStatus} 
              onForceSync={() => syncToCloud(leads, dailyData, outreachLog, adminKey)} 
            />
          )}
        </main>

        {/* Mobile Navigation Dock */}
        <MobileNav 
          activeView={activeView} 
          setActiveView={setActiveView} 
          navItems={navItems} 
        />
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowShortcutsHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 select-none animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">keyboard</span>
                Master Shortcuts
              </h2>
              <button onClick={() => setShowShortcutsHelp(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Clear Search</span>
                <kbd className="bg-slate-100 border-b-2 border-slate-300 px-2 py-0.5 rounded text-slate-700 font-mono">C / Esc</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Sweet Spot Filter</span>
                <kbd className="bg-primary/10 border-b-2 border-primary/20 px-2 py-0.5 rounded text-primary font-mono">S</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Reset All</span>
                <kbd className="bg-slate-100 border-b-2 border-slate-300 px-2 py-0.5 rounded text-slate-700 font-mono">R</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Jump To Page</span>
                <kbd className="bg-slate-100 border-b-2 border-slate-300 px-2 py-0.5 rounded text-slate-700 font-mono">P</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Toggle Help</span>
                <kbd className="bg-slate-100 border-b-2 border-slate-300 px-2 py-0.5 rounded text-slate-700 font-mono">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}