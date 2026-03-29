// src/components/lead-dashboard/CallSummaryModal.jsx
import React, { useState, useEffect } from 'react';

export default function CallSummaryModal({ lead, isAdmin, adminKey, onClose, onSaved }) {
  const [text, setText]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(null); // 'saved' | 'deleted' | 'error'

  // Load existing summary when modal opens
  useEffect(() => {
    if (!lead) return;
    setText('');
    setStatus(null);
    fetch(`/api/summaries?id=${encodeURIComponent(lead.id)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (data?.text) setText(data.text); })
      .catch(() => {});
  }, [lead?.id]);

  if (!lead) return null;

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth: adminKey,
          leadId: lead.id,
          leadName: lead.name,
          category: lead.category,
          text,
        }),
      });
      if (res.ok) {
        setStatus(text.trim() ? 'saved' : 'deleted');
        onSaved?.(lead.id, text.trim());
        setTimeout(onClose, 900);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '20px' }}>call_log</span>
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base leading-tight">Call Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">
                {lead.name}
                {lead.category ? <span className="ml-1 opacity-60">· {lead.category}</span> : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {!isAdmin && (
            <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2 text-xs font-semibold text-amber-700">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
              Unlock Admin Mode to edit summaries
            </div>
          )}

          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Notes / Summary
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={!isAdmin}
            placeholder={isAdmin
              ? "What happened on the call? Key points, follow-ups, objections..."
              : "No summary yet."}
            rows={7}
            className={`w-full rounded-xl border-2 p-4 text-sm leading-relaxed resize-none outline-none transition-all
              ${isAdmin
                ? 'border-slate-100 focus:border-primary/30 text-slate-800 placeholder:text-slate-300'
                : 'border-slate-100 bg-slate-50 text-slate-500 cursor-default'
              }`}
          />

          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-medium">
            <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
            {status === 'saved'   && <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined" style={{fontSize:'13px'}}>check_circle</span>Saved</span>}
            {status === 'deleted' && <span className="text-slate-400 font-bold flex items-center gap-1"><span className="material-symbols-outlined" style={{fontSize:'13px'}}>delete</span>Removed</span>}
            {status === 'error'   && <span className="text-red-500 font-bold">Failed to save</span>}
          </div>
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="px-6 pb-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            {text.trim() && (
              <button
                onClick={() => { setText(''); }}
                className="px-4 py-2.5 rounded-xl border border-red-100 text-red-400 font-bold text-sm hover:bg-red-50 transition-colors"
                title="Clear text (then Save to delete)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
              }
              {saving ? 'Saving...' : text.trim() ? 'Save Summary' : 'Delete Summary'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}