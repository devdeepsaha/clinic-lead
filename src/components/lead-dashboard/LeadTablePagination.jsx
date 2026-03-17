import React from 'react';

export default function LeadTablePagination({ safePage, totalPages, setPage, filteredCount, perPage }) {
  return (
    <>
      {/* Desktop Pagination */}
      <div className="hidden md:flex items-center justify-between border-t border-primary/10 bg-white px-5 py-3">
        <p className="text-xs text-slate-500">
          Showing {filteredCount === 0 ? 0 : (safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filteredCount)} of {filteredCount}
        </p>
        <div className="flex items-center gap-1.5">
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="flex items-center justify-center w-7 h-7 rounded border border-primary/15 text-slate-500 hover:bg-primary/5 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span></button>
          <span className="text-xs font-bold text-slate-600 px-2">Page {safePage} / {totalPages}</span>
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="flex items-center justify-center w-7 h-7 rounded border border-primary/15 text-slate-500 hover:bg-primary/5 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span></button>
        </div>
      </div>
      
      {/* Mobile Pagination */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-t border-primary/10">
        <p className="text-xs text-slate-500">
          {filteredCount > 0 ? `${(safePage - 1) * perPage + 1}–${Math.min(safePage * perPage, filteredCount)} of ${filteredCount}` : '0 results'}
        </p>
        <div className="flex items-center gap-1.5">
          <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="w-7 h-7 flex items-center justify-center rounded border border-primary/15 text-slate-500 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span></button>
          <span className="text-xs font-bold text-slate-600 px-1">{safePage}</span>
          <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="w-7 h-7 flex items-center justify-center rounded border border-primary/15 text-slate-500 disabled:opacity-30"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span></button>
        </div>
      </div>
    </>
  );
}