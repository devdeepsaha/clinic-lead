import React, { useState, useEffect } from 'react';
import LeadDashboard from './components/LeadDashboard';
import OutreachCalendar from './components/lead-dashboard/OutreachCalendar';
import FALLBACK_LEADS from './data/fallback-leads';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [leads, setLeads] = useState([]);
  const [outreachLog, setOutreachLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [dataMode, setDataMode] = useState('local'); 
  const [dataSource, setDataSource] = useState("Local File");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [activeView, setActiveView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rangeFilters, setRangeFilters] = useState({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 5000 });

  const [dailyData, setDailyData] = useState({
    date: getLocalDateString(),
    goal: 10,
    counts: { job: 0, build_no_demo: 0, build_demo: 0 }
  });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (e.key === 'Escape') { setSearchQuery(''); setShowShortcutsHelp(false); setIsCalendarOpen(false); return; }
      if (e.key === '?') { e.preventDefault(); setShowShortcutsHelp(prev => !prev); }
      if (key === 'c') { e.preventDefault(); setSearchQuery(''); }
      if (key === 's') { e.preventDefault(); setRangeFilters({ ratingMin: 3.5, ratingMax: 4.5, reviewsMin: 50, reviewsMax: 500 }); setPage(1); setActiveView('leads'); }
      if (key === 'r') { e.preventDefault(); setRangeFilters({ ratingMin: 0, ratingMax: 5, reviewsMin: 0, reviewsMax: 5000 }); setSearchQuery(''); setPage(1); }
      
      if (key === 'p') {
  e.preventDefault();
  const targetPage = prompt("Jump to Page:");
  if (targetPage) {
    const parsed = parseInt(targetPage, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPage(parsed);
      setActiveView('leads'); // Force switch to Directory view so they see the page change
    }
  }
}
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, searchQuery, page, rangeFilters]);

  // Admin Auth Logic
  const handleToggleAdmin = async () => {
    if (isAdmin) { 
      setIsAdmin(false); setAdminKey(""); 
      sessionStorage.removeItem('admin_session_key'); return; 
    }
    const input = prompt("Enter Admin Security Key:");
    if (!input) return;
    try {
      const res = await fetch(`/api/statuses?auth=${encodeURIComponent(input)}`, { cache: 'no-store' });
      if (res.ok) {
        setAdminKey(input); setIsAdmin(true);
        sessionStorage.setItem('admin_session_key', input);
      } else { alert("Invalid Key."); }
    } catch (err) { alert("Connection error."); }
  };

  // RECENTLY CHANGED: Persist admin session on refresh
  useEffect(() => {
    const savedKey = sessionStorage.getItem('admin_session_key');
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAdmin(true);
    }
  }, []);

  // Sync Logic - CRITICAL FIX: Ensure it always uses the freshest data
  const syncToCloud = async (updatedLeads, updatedDaily, updatedOutreach, currentKey) => {
    try {
      setSyncStatus('syncing');
      const statuses = {};
      // Use provided updatedLeads OR fallback to current state
      const leadsToSync = updatedLeads || leads;
      leadsToSync.forEach(l => { if(l && l.id) statuses[l.id] = { status: l.status, replied: l.replied }; });

      await fetch('/api/statuses', {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth: currentKey || adminKey, 
          statuses, 
          daily: updatedDaily || dailyData,
          outreach: updatedOutreach || outreachLog,
        }),
      });
      setSyncStatus('synced');
    } catch (e) { setSyncStatus('error'); }
  };

  const handleDeleteEntry = async (timestamp) => {
    // 1. Identify what we are deleting before it's gone
    const entryToDelete = outreachLog.find(e => e.ts === timestamp);
    if (!entryToDelete) return;

    // 2. Create the updated log
    const updatedLog = outreachLog.filter(entry => entry.ts !== timestamp);
    setOutreachLog(updatedLog);
    
    // 3. Check if the entry happened TODAY
    const entryDate = getLocalDateString(new Date(timestamp));
    const todayStr = getLocalDateString();

    let updatedDaily = dailyData;

    if (entryDate === todayStr) {
      // RECENTLY CHANGED: Logic to decrement the daily card counter
      const newCounts = { ...dailyData.counts };
      const type = entryToDelete.tplKey; // 'job', 'build_no_demo', or 'build_demo'

      if (newCounts[type] > 0) {
        newCounts[type] -= 1;
      }

      updatedDaily = { ...dailyData, counts: newCounts };
      setDailyData(updatedDaily);
    }

    // 4. Sync the updated log AND the updated daily counts to the cloud
    syncToCloud(leads, updatedDaily, updatedLog, adminKey);
  };

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      let fetchedCloudLeads = [];
      let fetchedStatuses = {};
      let fetchedOutreach = [];
      try {
        const timestamp = Date.now();
        const [lRes, sRes] = await Promise.all([
          fetch(`/api/leads?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
          fetch(`/api/statuses?t=${timestamp}`, { cache: 'no-store' }).catch(() => null)
        ]);
        if (lRes?.ok) fetchedCloudLeads = await lRes.json();
        if (sRes?.ok) {
          const sData = await sRes.json();
          fetchedStatuses = sData.statuses || sData;
          if (sData.outreach) fetchedOutreach = sData.outreach;
          if (sData.daily) setDailyData(sData.daily);
        }
      } catch (err) { console.error(err); }
      
      const baseLeads = (dataMode === 'cloud' && Array.isArray(fetchedCloudLeads) && fetchedCloudLeads.length > 0)
        ? fetchedCloudLeads : FALLBACK_LEADS;
      
      const mergedLeads = baseLeads.map(l => ({
        ...l, id: String(l.id),
        status: (typeof fetchedStatuses[l.id] === 'object' ? fetchedStatuses[l.id].status : fetchedStatuses[l.id]) || "none",
        replied: (typeof fetchedStatuses[l.id] === 'object' ? !!fetchedStatuses[l.id].replied : false),
      }));
      setLeads(mergedLeads); setOutreachLog(fetchedOutreach); setIsLoading(false);
      setDataSource(dataMode === 'cloud' ? "Vercel Cloud" : "Local File");
    };
    initializeApp();
  }, [dataMode]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <LeadDashboard 
        {...{
          leads, setLeads, outreachLog, setOutreachLog, dailyData, setDailyData,
          isLoading, syncStatus, dataMode, setDataMode, dataSource, isAdmin, 
          adminKey, handleToggleAdmin, syncToCloud, showShortcutsHelp, setShowShortcutsHelp,
          searchQuery, setSearchQuery, page, setPage, rangeFilters, setRangeFilters,
          activeView, setActiveView,
          onOpenCalendar: () => setIsCalendarOpen(true)
        }}
      />

      <OutreachCalendar 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        outreachLog={outreachLog}
        onDeleteEntry={handleDeleteEntry}
      />
    </div>
  );
}