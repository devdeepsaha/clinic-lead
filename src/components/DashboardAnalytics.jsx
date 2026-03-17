import React, { useMemo, useEffect, useRef } from 'react';
import AnalyticsHeader from './dashboard/AnalyticsHeader';
import DailyOutreachCard from './dashboard/DailyOutreachCard';
import StatDonut from './dashboard/StatDonut';
import LeadMap from './dashboard/LeadMap';
import DatabaseBreakdown from './dashboard/DatabaseBreakdown';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardAnalytics({ 
  leads, 
  dailyData, 
  dataSource, 
  selectedMapLead, 
  onViewInDirectory, 
  onOpenCalendar 
}) {
  const mapSectionRef = useRef(null);
  const markerRefs = useRef({});

  useEffect(() => {
    if (selectedMapLead && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedMapLead]);

  const stats = useMemo(() => {
    const job = leads.filter(l => l.status === "job").length;
    const build = leads.filter(l => l.status === "build").length;
    const buildPlus = leads.filter(l => l.status === "build_plus").length;
    const skip = leads.filter(l => l.status === "none").length;
    const dismissed = leads.filter(l => l.status === "dismissed").length;
    const replied = leads.filter(l => l.replied).length;

    const free = build + buildPlus;
    const tagged = job + free;
    const total = leads.length;
    const pct = total ? Math.round((tagged / total) * 100) : 0;

    return { job, build, buildPlus, skip, dismissed, free, tagged, total, unset: skip, pct, replied };
  }, [leads]);

  // RECENTLY CHANGED: Ensure counts are derived strictly from the current dailyData state
  const todayStr = getLocalDateString();
  const isToday = dailyData.date === todayStr;
  
  const counts = {
    job: isToday ? (dailyData.counts.job || 0) : 0,
    build_no_demo: isToday ? (dailyData.counts.build_no_demo || 0) : 0,
    build_demo: isToday ? (dailyData.counts.build_demo || 0) : 0
  };

  // RECENTLY CHANGED: Recalculate totals dynamically to handle deletions correctly
  const dailyTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const dailyPct = Math.min(100, Math.round((dailyTotal / (dailyData.goal || 10)) * 100));

  const mappableLeads = useMemo(() => {
    return leads.filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng));
  }, [leads]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'job': return '#10b981'; 
      case 'build': return '#9855f6'; 
      case 'build_plus': return '#3b82f6'; 
      case 'dismissed': return '#ef4444'; 
      default: return '#94a3b8'; 
    }
  };

  return (
    <div id="view-dashboard" className="flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col scroll-smooth select-text custom-scrollbar">
      {/* Title Section */}
      <div className="mb-5 hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Dashboard Analytics</h1>
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{stats.total}</span> leads currently active · 
          <span className="text-primary font-medium ml-1">Source: {dataSource}</span>
        </p>
      </div>

      {/* 1. Top Quick Stats Row */}
      <AnalyticsHeader stats={stats} />

      {/* 2. Middle Row: Tagging on Left (1/3), Outreach & Breakdown on Right (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        
        {/* LEFT COLUMN: StatDonut */}
        <div className="lg:col-span-1">
          <StatDonut pct={stats.pct} stats={stats} />
        </div>
        
        {/* RIGHT COLUMN: Stacked Outreach and Breakdown */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <DailyOutreachCard 
            dailyTotal={dailyTotal} 
            dailyPct={dailyPct} 
            counts={counts} 
            onOpenCalendar={onOpenCalendar} 
          />
          
          <DatabaseBreakdown leads={leads} />
        </div>
      </div>

      {/* 3. Bottom Row: Map Section */}
      <div ref={mapSectionRef} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <LeadMap 
          mappableLeads={mappableLeads} 
          selectedMapLead={selectedMapLead} 
          markerRefs={markerRefs} 
          getStatusColor={getStatusColor} 
          onViewInDirectory={handleViewInDirectoryInternal} 
        />
      </div>
    </div>
  );

  // Internal helper to ensure navigation works from the map
  function handleViewInDirectoryInternal(lead) {
    onViewInDirectory(lead);
  }
}