import React, { useState, useMemo } from 'react';
import LeadTableControls from './LeadTableControls';
import LeadTableDesktop from './LeadTableDesktop';
import LeadTableMobile from './LeadTableMobile';
import LeadTablePagination from './LeadTablePagination';
// RECENTLY CHANGED: Removed PersonalizeModal import as AI is no longer needed
import { TEMPLATES } from '../../data/templates';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LeadTable({ 
  leads = [], isAdmin = false, setLeads, 
  dailyData, setDailyData, outreachLog = [], setOutreachLog,
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  catFilter, setCatFilter,
  sortType, setSortType,
  page, setPage,
  perPage, setPerPage,
  copyMode, setCopyMode,
  rangeFilters, setRangeFilters,
  onLocate 
}) {
  
  const [toastMsg, setToastMsg] = useState(null);
  // RECENTLY CHANGED: Removed personalizeModal state

  const MAX_REVIEWS_SLIDER = 5000;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const categories = useMemo(() => {
    const counts = {};
    leads.forEach((l) => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let arr = leads.filter((l) => {
      if (statusFilter === "replied") {
        if (!l.replied) return false;
      } else if (statusFilter !== "all" && l.status !== statusFilter) {
        return false;
      }
      if (catFilter !== "all" && l.category !== catFilter) return false;

      const r = l.rating || 0;
      const rev = l.reviews || 0;
      if (r < rangeFilters.ratingMin || r > rangeFilters.ratingMax) return false;
      if (rev < rangeFilters.reviewsMin) return false;
      if (rangeFilters.reviewsMax < MAX_REVIEWS_SLIDER && rev > rangeFilters.reviewsMax) return false;
      
      if (searchQuery) {
        const q = String(searchQuery).toLowerCase();
        const n = String(l.name || '').toLowerCase();
        const p = String(l.phone || '').toLowerCase();
        const e = String(l.email || '').toLowerCase();
        const c = String(l.category || '').toLowerCase();
        if (!n.includes(q) && !p.includes(q) && !e.includes(q) && !c.includes(q)) return false;
      }
      return true;
    });

    switch (sortType) {
      case "name_asc": arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc": arr.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "reviews_desc": arr.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)); break;
      case "reviews_asc": arr.sort((a, b) => (a.reviews || 0) - (b.reviews || 0)); break;
      case "rating_desc": arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "rating_asc": arr.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
      case "cat_reviews": arr.sort((a, b) => a.category.localeCompare(b.category) || (b.reviews || 0) - (a.reviews || 0)); break;
      case "cat_rating": arr.sort((a, b) => a.category.localeCompare(b.category) || (b.rating || 0) - (a.rating || 0)); break;
      case "cat_name": arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)); break;
      default: break;
    }
    return arr;
  }, [leads, statusFilter, catFilter, sortType, searchQuery, rangeFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / perPage));
  const safePage = Math.min(page, totalPages) || 1;
  const paginatedLeads = filteredLeads.slice((safePage - 1) * perPage, safePage * perPage);

  const updateLead = (id, updates) => {
    if (!isAdmin && (updates.status || updates.replied !== undefined)) {
      return showToast("Unlock Admin Mode to modify leads.");
    }
    const newLeads = leads.map(l => l.id === id ? { ...l, ...updates } : l);
    setLeads(newLeads);
  };

  const handleStatusClick = (id, newStatus) => {
    if (!isAdmin) return showToast("Unlock Admin Mode to tag leads.");
    const lead = leads.find(l => l.id === id);
    const finalStatus = lead.status === newStatus ? 'none' : newStatus;
    updateLead(id, { status: finalStatus });
  };

  const logOutreachInternal = (lead) => {
    if (!isAdmin) return;
    const actualTplKey = lead.status;
    const newEntry = { id: lead.id, name: lead.name, category: lead.category || "", tplKey: actualTplKey, ts: Date.now() };

    setOutreachLog([newEntry, ...outreachLog]);
    const today = getLocalDateString();
    
    // RECENTLY CHANGED: Aligned daily counters perfectly with statuses.js (message, call, skip, dismissed)
    let newCounts = dailyData.date === today ? { ...dailyData.counts } : { message: 0, call: 0, skip: 0, dismissed: 0 };
    if (newCounts[actualTplKey] !== undefined) newCounts[actualTplKey]++;
    setDailyData({ ...dailyData, date: today, counts: newCounts });
  };

  // RECENTLY CHANGED: Bypassing the AI modal completely and copying the template directly
  const handleCopyTemplate = async (lead) => {
    const tpl = TEMPLATES[copyMode][lead.status];
    if (!tpl) return showToast("Tag lead as Message to copy template");

    try {
      const finalMsg = tpl.build(lead.name);
      await navigator.clipboard.writeText(finalMsg);
      logOutreachInternal(lead);
      showToast("Template Copied!");
    } catch (err) {
      console.error("Copy Error:", err);
      showToast("Failed to copy to clipboard");
    }
  };

  // RECENTLY CHANGED: Removed handleGenerateSmartOutreach entirely

  const handleEmailCopy = (email) => {
    navigator.clipboard.writeText(email).then(() => showToast("Copied " + email));
  };

  const handlePhoneCopy = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    navigator.clipboard.writeText(cleanPhone).then(() => {
      showToast("Copied 10-digit phone: " + cleanPhone);
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-background-light md:bg-white">
      {toastMsg && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-xl whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      <LeadTableControls 
        {...{ isAdmin, searchQuery, setSearchQuery, statusFilter, setStatusFilter, catFilter, setCatFilter, sortType, setSortType, rangeFilters, setRangeFilters, setPage, perPage, setPerPage, copyMode, setCopyMode, categories }}
        totalLeads={leads.length}
        filteredCount={filteredLeads.length}
      />

      <LeadTableDesktop 
        {...{ leads, setLeads, paginatedLeads, isAdmin, copyMode, handleStatusClick, handleCopyTemplate, handleEmailCopy, handlePhoneCopy, updateLead, onLocate }}
      />

      <LeadTableMobile 
        {...{ paginatedLeads, isAdmin, copyMode, handleStatusClick, handleCopyTemplate, handleEmailCopy, handlePhoneCopy, updateLead, onLocate }}
      />

      <LeadTablePagination 
        safePage={safePage} totalPages={totalPages} setPage={setPage}
        filteredCount={filteredLeads.length} perPage={perPage}
      />
      
    
    </div>
  );
}