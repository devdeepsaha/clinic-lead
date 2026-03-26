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
    // STATUS KEYS: message, call, skip, dismissed, none
    const message = leads.filter(l => l.status === "message").length;
    const call    = leads.filter(l => l.status === "call").length;
    const skip    = leads.filter(l => l.status === "skip").length;
    const dismissed = leads.filter(l => l.status === "dismissed").length;
    const unset   = leads.filter(l => l.status === "none").length;
    const replied = leads.filter(l => l.replied).length;

    const tagged  = message + call + skip + dismissed;
    const total   = leads.length;
    const pct     = total ? Math.round((tagged / total) * 100) : 0;

    return { message, call, skip, dismissed, unset, replied, tagged, total, pct };
  }, [leads]);

  const todayStr = getLocalDateString();
  const isToday  = dailyData.date === todayStr;

  const counts = {
    message:   isToday ? (dailyData.counts.message   || 0) : 0,
    call:      isToday ? (dailyData.counts.call      || 0) : 0,
    skip:      isToday ? (dailyData.counts.skip      || 0) : 0,
    dismissed: isToday ? (dailyData.counts.dismissed || 0) : 0,
  };

  const dailyTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const dailyPct   = Math.min(100, Math.round((dailyTotal / (dailyData.goal || 10)) * 100));

  const mappableLeads = useMemo(() => {
    return leads.filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng));
  }, [leads]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'message':   return '#9855f6';
      case 'call':      return '#10b981';
      case 'skip':      return '#94a3b8';
      case 'dismissed': return '#ef4444';
      default:          return '#cbd5e1';
    }
  };

  return (
    <div id="view-dashboard" className="flex-1 p-4 lg:p-6 overflow-y-auto flex flex-col scroll-smooth select-text custom-scrollbar">
      <div className="mb-5 hidden lg:block">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">Dashboard Analytics</h1>
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{stats.total}</span> leads currently active · 
          <span className="text-primary font-medium ml-1">Source: {dataSource}</span>
        </p>
      </div>

      <AnalyticsHeader stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-1">
          <StatDonut pct={stats.pct} stats={stats} />
        </div>
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

      <div ref={mapSectionRef} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <LeadMap 
          mappableLeads={mappableLeads} 
          selectedMapLead={selectedMapLead} 
          markerRefs={markerRefs} 
          getStatusColor={getStatusColor} 
          onViewInDirectory={onViewInDirectory}
        />
      </div>
    </div>
  );
}