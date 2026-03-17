import React from 'react';

export default function LeadTableMobile({
  paginatedLeads, isAdmin, copyMode, handleStatusClick, 
  handleCopyTemplate, handleEmailCopy, 
  handlePhoneCopy, 
  updateLead, onLocate
}) {

  const openGoogleMaps = (e, lead) => {
    e.stopPropagation();
    if (lead.lat && lead.lng) {
      // NOTE: Using a standard google maps URL format here for reliable opening
      window.open(`https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`, '_blank');
    } else if (lead.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + lead.address)}`, '_blank');
    }
  };

  return (
    <div className="md:hidden flex-1 overflow-y-auto px-4 py-2 space-y-4">
      {paginatedLeads.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <span className="material-symbols-outlined block text-4xl mb-2">search_off</span>
          No leads found.
        </div>
      ) : paginatedLeads.map((l) => {
        const urlObj = l.website ? new URL(l.website.startsWith('http') ? l.website : `https://${l.website}`).hostname.replace('www.', '') : null;
        const canMap = (l.lat && l.lng) || l.address;

        return (
          <div key={l.id} className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className={`font-bold text-sm leading-tight pt-1 ${canMap ? 'text-slate-900 cursor-pointer active:text-primary' : 'text-slate-900'}`}>
                      {/* Clicking the name still opens the inbuilt map */}
                      <span onClick={() => { if(canMap) onLocate(l); }}>{l.name}</span>
                    </h3>
                    {/* RECENTLY CHANGED: Removed the old circular map button from here */}
                  </div>
                  
                  {urlObj ? (
                    <a className="text-primary text-xs font-medium flex items-center gap-0.5 w-fit" href={l.website} target="_blank" rel="noreferrer">
                      <span className="truncate">{urlObj}</span><span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">No website</span>
                  )}
                  
                  {/* RECENTLY CHANGED: Added "Open Maps" button inline with Phone and Email, styled as neat chips */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {l.phone && (
                      <span 
                        className="text-[11px] text-slate-600 font-mono flex items-center gap-1 cursor-pointer active:bg-slate-200 transition-colors bg-slate-100 px-2 py-1 rounded border border-slate-200"
                        onClick={() => handlePhoneCopy(l.phone)}
                      >
                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '13px' }}>phone</span>{l.phone}
                      </span>
                    )}
                    {l.email && (
                      <span 
                        className="text-[11px] text-primary cursor-pointer bg-primary/5 px-2 py-1 rounded border border-primary/10 active:bg-primary/20 transition-colors truncate max-w-[120px]" 
                        onClick={() => handleEmailCopy(l.email)}
                      >
                        {l.email}
                      </span>
                    )}
                    {canMap && (
                      <button 
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded hover:bg-blue-100 active:bg-blue-200 transition-colors" 
                        onClick={(e) => openGoogleMaps(e, l)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>map</span>
                        Open Maps
                      </button>
                    )}
                  </div>
                  
                  {l.reviews && (
                    <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-1">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>reviews</span>
                      {Number(l.reviews).toLocaleString()} Reviews
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {l.rating && (
                    <div className="flex items-center gap-1 text-slate-700 text-[11px] font-bold">
                      <span className="material-symbols-outlined fill-1 text-amber-400" style={{ fontSize: '14px' }}>star</span>{l.rating}
                    </div>
                  )}
                  <span className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{l.category}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 px-3 py-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`flex flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm ${!isAdmin ? 'opacity-40 grayscale' : ''}`}>
                  <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'message')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'message' ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 border-r border-slate-100'}`}>Message</button>
                  <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'call')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'call' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border-r border-slate-100'}`}>Call</button>
                  <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'skip')} className={`flex-1 py-2 text-[10px] font-black uppercase transition-colors ${l.status === 'skip' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-400 border-r border-slate-100'}`}>Skip</button>
                  <button disabled={!isAdmin} onClick={() => handleStatusClick(l.id, 'dismissed')} className={`w-8 py-2 text-[10px] font-black uppercase transition-colors flex items-center justify-center ${l.status === 'dismissed' ? 'bg-red-500 text-white' : 'bg-white text-slate-400'}`}>✕</button>
                </div>
                <button disabled={!['message', 'call'].includes(l.status)} onClick={() => handleCopyTemplate(l)} className={`flex-shrink-0 w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all ${!['message', 'call'].includes(l.status) ? 'bg-slate-200 text-slate-400' : copyMode === 'whatsapp' ? 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/20' : 'bg-primary text-white shadow-md shadow-primary/20'}`}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span></button>
                <button disabled={!isAdmin} onClick={() => updateLead(l.id, { replied: !l.replied })} className={`flex-shrink-0 w-10 h-10 rounded-xl inline-flex items-center justify-center transition-all ${l.replied ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-slate-200 text-slate-300'}`}><span className="material-symbols-outlined fill-1" style={{ fontSize: '20px' }}>{l.replied ? "mark_email_read" : "mail"}</span></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}