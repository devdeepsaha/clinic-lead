import React, { useState } from 'react';
import TimingModal from './TimingModal';

export default function LeadTableDesktop({
  leads, setLeads, paginatedLeads, isAdmin, copyMode, 
  handleStatusClick, handleCopyTemplate, handleEmailCopy, 
  handlePhoneCopy, 
  updateLead, onLocate 
}) {
  const [timingModalLead, setTimingModalLead] = useState(null);

  const openGoogleMaps = (e, lead) => {
    e.stopPropagation();
    if (lead.lat && lead.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`, '_blank');
    } else if (lead.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + lead.address)}`, '_blank');
    }
  };

  return (
    <div className="hidden md:block flex-1 overflow-auto bg-white relative">
      <table className="w-full text-left text-sm" style={{ minWidth: '1050px' }}>
        <thead className="sticky top-0 z-10 bg-primary/5 border-b border-primary/10 text-slate-500">
          <tr>
            <th className="px-4 py-3 w-10">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-primary w-3.5 h-3.5"
                onChange={(e) => {
                  const checked = e.target.checked;
                  const idsOnPage = paginatedLeads.map(l => l.id);
                  const newLeads = leads.map(l => idsOnPage.includes(l.id) ? { ...l, checked } : l);
                  setLeads(newLeads);
                }}
              />
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Business & Website</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Rating</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Reviews</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">Contact</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Hours</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Status Controls</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Copy</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center">Replied</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/5">
          {paginatedLeads.length === 0 ? (
            <tr><td colSpan="10" className="text-center py-16 text-slate-400">No leads match your filters.</td></tr>
          ) : paginatedLeads.map((l) => {
            const urlObj = l.website ? new URL(l.website.startsWith('http') ? l.website : `https://${l.website}`).hostname.replace('www.', '') : null;
            const canMap = (l.lat && l.lng) || l.address;

            return (
              <tr key={l.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-4 py-4">
                  <input type="checkbox" checked={l.checked || false} onChange={(e) => updateLead(l.id, { checked: e.target.checked })} className="rounded border-slate-300 text-primary w-3.5 h-3.5"/>
                </td>
                <td className="px-4 py-4 min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className={`font-bold text-sm truncate max-w-[220px] block ${canMap ? 'text-slate-900 cursor-pointer hover:text-primary hover:underline' : 'text-slate-900'}`}
                      onClick={() => { if(canMap) onLocate(l); }}
                      title={canMap ? "View exact location on inbuilt Map" : ""}
                    >
                      {l.name}
                    </span>
                    
                    {/* RECENTLY CHANGED: Upgraded Map Icons to actual buttons with large touch targets and backgrounds */}
                    {canMap && (
                      <div className="flex items-center gap-1 ml-2">
                        
                        <button 
                          className="p-1.5 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center" 
                          onClick={(e) => openGoogleMaps(e, l)} 
                          title="Open in Google Maps"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[220px]">
                    {urlObj ? (
                      <a href={l.website} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
                        {urlObj} <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '12px' }}>open_in_new</span>
                      </a>
                    ) : <span className="text-slate-300">no website</span>}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-wider whitespace-nowrap max-w-[130px] overflow-hidden text-ellipsis border border-primary/10">{l.category}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-amber-700 font-bold text-xs">
                    <span className="material-symbols-outlined fill-1 text-amber-400" style={{ fontSize: '13px' }}>star</span>{l.rating || "—"}
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-xs font-medium text-slate-500">{l.reviews ? Number(l.reviews).toLocaleString() : "—"}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span 
                      className={`text-[11px] font-bold font-mono transition-colors ${l.phone ? 'text-slate-600 cursor-pointer hover:text-primary hover:underline' : 'text-slate-300'}`}
                      onClick={() => l.phone && handlePhoneCopy(l.phone)}
                      title={l.phone ? "Click to copy phone" : ""}
                    >
                      {l.phone || "—"}
                    </span>
                    {l.email && (
                      <span 
                        className="text-[10px] text-primary truncate max-w-[140px] cursor-pointer hover:underline font-medium" 
                        onClick={() => handleEmailCopy(l.email)} 
                        title="Click to copy email"
                      >
                        {l.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <button 
                    onClick={() => setTimingModalLead(l)}
                    className="w-7 h-7 rounded-md inline-flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors mx-auto"
                    title="View Business Hours"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className={`tbl-seg mx-auto w-fit flex border border-slate-200 rounded-lg overflow-hidden ${!isAdmin ? 'opacity-40 grayscale' : ''}`}>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'message')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'message' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Message</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'call')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'call' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Call</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'skip')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'skip' ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:bg-slate-50 border-r border-slate-200'}`}>Skip</button>
                    <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'dismissed')} className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${l.status === 'dismissed' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-50'}`}>✕</button>
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <button disabled={!['message', 'call'].includes(l.status)} onClick={() => handleCopyTemplate(l)} className={`flex-shrink-0 w-7 h-7 rounded-md inline-flex items-center justify-center transition-all ${!['message', 'call'].includes(l.status) ? 'bg-slate-100 text-slate-300 cursor-default' : copyMode === 'whatsapp' ? 'bg-[#25D366] text-white hover:bg-[#20bd5a] cursor-pointer active:scale-95' : 'bg-primary text-white hover:bg-primary/80 cursor-pointer active:scale-95'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
                  </button>
                </td>
                <td className="px-4 py-4 text-center">
                  <button disabled={!isAdmin} onClick={() => updateLead(l.id, { replied: !l.replied })} className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${l.replied ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300 hover:bg-emerald-50 hover:text-emerald-400"}`}>
                    <span className="material-symbols-outlined fill-1" style={{ fontSize: '16px' }}>{l.replied ? "mark_email_read" : "mail"}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <TimingModal 
        lead={timingModalLead} 
        onClose={() => setTimingModalLead(null)} 
      />
    </div>
  );
}