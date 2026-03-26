import React, { useState, useEffect, useCallback } from 'react';
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
            setActiveView('leads');
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

  // Persist admin session on refresh
  useEffect(() => {
    const savedKey = sessionStorage.getItem('admin_session_key');
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAdmin(true);
    }
  }, []);

  // syncToCloud — always uses the freshest data passed in
  const syncToCloud = useCallback(async (updatedLeads, updatedDaily, updatedOutreach, currentKey) => {
    const keyToUse = currentKey || adminKey;
    if (!keyToUse) return; // Don't attempt sync without an admin key
    try {
      setSyncStatus('syncing');
      const statuses = {};
      const leadsToSync = updatedLeads || leads;
      leadsToSync.forEach(l => {
        if (l && l.id) statuses[l.id] = { status: l.status, replied: l.replied };
      });

      const res = await fetch('/api/statuses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth: keyToUse,
          statuses,
          daily: updatedDaily || dailyData,
          outreach: updatedOutreach || outreachLog,
        }),
      });

      if (res.ok) {
        setSyncStatus('synced');
      } else {
        console.error("Sync failed with status:", res.status);
        setSyncStatus('error');
      }
    } catch (e) {
      console.error("Sync error:", e);
      setSyncStatus('error');
    }
  }, [adminKey, leads, dailyData, outreachLog]);

  // FIX: Wrap setLeads so every status change automatically syncs to KV
  const setLeadsAndSync = useCallback((updatedLeads) => {
    setLeads(updatedLeads);
    syncToCloud(updatedLeads, dailyData, outreachLog, adminKey);
  }, [syncToCloud, dailyData, outreachLog, adminKey]);

  const handleDeleteEntry = async (timestamp) => {
    const entryToDelete = outreachLog.find(e => e.ts === timestamp);
    if (!entryToDelete) return;

    const updatedLog = outreachLog.filter(entry => entry.ts !== timestamp);
    setOutreachLog(updatedLog);

    const entryDate = getLocalDateString(new Date(timestamp));
    const todayStr = getLocalDateString();

    let updatedDaily = dailyData;

    if (entryDate === todayStr) {
      const newCounts = { ...dailyData.counts };
      const type = entryToDelete.tplKey;
      if (newCounts[type] > 0) {
        newCounts[type] -= 1;
      }
      updatedDaily = { ...dailyData, counts: newCounts };
      setDailyData(updatedDaily);
    }

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
      } catch (err) {
        console.error("Init error:", err);
      }

      const baseLeads = (dataMode === 'cloud' && Array.isArray(fetchedCloudLeads) && fetchedCloudLeads.length > 0)
        ? fetchedCloudLeads : FALLBACK_LEADS;

      // DEBUG: Uncomment these two lines if statuses still don't load after deploy
       console.log("KV statuses keys (first 3):", Object.keys(fetchedStatuses).slice(0, 3));
       console.log("Fallback lead IDs (first 3):", baseLeads.slice(0, 3).map(l => String(l.id)));

      // FIX: Normalise ID to string on both sides so KV keys always match
      const mergedLeads = baseLeads.map(l => {
        const id = String(l.id);
        const saved = fetchedStatuses[id] || fetchedStatuses[l.id];
        return {
          ...l,
          id,
          status: (typeof saved === 'object' ? saved.status : saved) || "none",
          replied: (typeof saved === 'object' ? !!saved.replied : false),
        };
      });

      setLeads(mergedLeads);
      setOutreachLog(fetchedOutreach);
      setIsLoading(false);
      setDataSource(dataMode === 'cloud' ? "Vercel Cloud" : "Local File");
    };
    initializeApp();
  }, [dataMode]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <LeadDashboard
        {...{
          leads,
          // FIX: Use setLeadsAndSync instead of raw setLeads so all status changes persist
          setLeads: setLeadsAndSync,
          outreachLog, setOutreachLog,
          dailyData, setDailyData,
          isLoading, syncStatus,
          dataMode, setDataMode, dataSource,
          isAdmin, adminKey, handleToggleAdmin,
          syncToCloud,
          showShortcutsHelp, setShowShortcutsHelp,
          searchQuery, setSearchQuery,
          page, setPage,
          rangeFilters, setRangeFilters,
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