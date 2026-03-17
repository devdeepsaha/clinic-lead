import React, { useState, useMemo } from 'react';

export default function SettingsPanel({ leads, isAdmin = false, adminKey = "", setLeads, dailyData, setDailyData, syncStatus, onForceSync }) {
  const [goalInput, setGoalInput] = useState(dailyData.goal || 10);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ msg: '', type: '' });

  const stats = useMemo(() => {
    // RECENTLY CHANGED: Updated status checks to match new statuses
    const tagged = leads.filter(l => ['message', 'call'].includes(l.status)).length;
    const categories = new Set(leads.map(l => l.category)).size;
    
    const payloadString = JSON.stringify(leads);
    const bytes = new Blob([payloadString]).size;
    const kb = bytes / 1024;
    const mb = bytes / (1024 * 1024);
    
    const sizeDisplay = bytes > 1024 * 1024 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
    const percentOfLimit = Math.min(100, Math.round((kb / 1024) * 100)); 

    return { total: leads.length, tagged, categories, sizeDisplay, percentOfLimit, kb };
  }, [leads]);

  const handleDeepSync = async () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to sync.");
    setUploadStatus({ msg: "Pushing all data to Vercel KV...", type: "loading" });
    try {
      const resLeads = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leads)
      });
      if (!resLeads.ok) throw new Error("Failed to sync base leads.");
      
      // Trigger the status/daily data sync
      await onForceSync();
      
      setUploadStatus({ msg: "✅ Deep Cloud Sync Complete!", type: "success" });
      setTimeout(() => setUploadStatus({ msg: '', type: '' }), 4000);
    } catch (err) {
      setUploadStatus({ msg: `❌ Sync failed: ${err.message}`, type: "error" });
    }
  };

  const downloadStatusBackup = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode.");
    const map = {};
    leads.forEach((l) => { map[l.id] = { status: l.status, replied: l.replied }; });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(map, null, 2)], { type: "application/json" }));
    a.download = "leadflow_statuses_backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const parseCSVRow = (line) => {
    const result = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQ = !inQ;
      else if (c === "," && !inQ) { result.push(cur); cur = ""; }
      else cur += c;
    }
    result.push(cur);
    return result.map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"'));
  };

  const parseCSV = (text) => {
    text = text.replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());
    
    const idx = (names) => {
      for (const n of names) {
        const i = headers.findIndex((h) => h === n.toLowerCase());
        if (i >= 0) return i;
      }
      return -1;
    };
    
    // RECENTLY CHANGED: Added mapping for business timing columns
    const col = {
      id: idx(["Place ID", "id", "place_id"]),
      name: idx(["Business Name", "name", "business_name"]),
      phone: idx(["Phone", "phone"]),
      website: idx(["Website", "website", "url"]),
      email: idx(["Emails", "Email", "email"]),
      category: idx(["Category", "category"]),
      address: idx(["Address", "address"]),
      rating: idx(["Rating", "rating"]),
      reviews: idx(["Reviews", "reviews", "review_count"]),
      lat: idx(["Latitude", "lat", "latitude"]), 
      lng: idx(["Longitude", "lng", "lon", "longitude"]), 
      monday: idx(["Monday Hours", "monday"]),
      tuesday: idx(["Tuesday Hours", "tuesday"]),
      wednesday: idx(["Wednesday Hours", "wednesday"]),
      thursday: idx(["Thursday Hours", "thursday"]),
      friday: idx(["Friday Hours", "friday"]),
      saturday: idx(["Saturday Hours", "saturday"]),
      sunday: idx(["Sunday Hours", "sunday"]),
    };
    
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length < 3) continue;
      const g = (c) => (c >= 0 ? (row[c] || "").trim() : "");
      
      const latVal = parseFloat(g(col.lat));
      const lngVal = parseFloat(g(col.lng));

      // RECENTLY CHANGED: Added parsed timings into the new lead object
      results.push({
        id: g(col.id) || `csv_${i}_${Date.now()}`,
        name: g(col.name),
        phone: g(col.phone),
        website: g(col.website),
        email: g(col.email),
        category: g(col.category) || "Uncategorized",
        address: g(col.address),
        rating: parseFloat(g(col.rating)) || null,
        reviews: parseInt(g(col.reviews)) || null,
        lat: isNaN(latVal) ? null : latVal, 
        lng: isNaN(lngVal) ? null : lngVal, 
        monday: g(col.monday),
        tuesday: g(col.tuesday),
        wednesday: g(col.wednesday),
        thursday: g(col.thursday),
        friday: g(col.friday),
        saturday: g(col.saturday),
        sunday: g(col.sunday),
        status: 'none',
        replied: false,
        checked: false
      });
    }
    return results.filter((r) => r.name);
  };

  const handleFile = (file) => {
    if (!isAdmin) return setUploadStatus({ msg: '🔒 Unlock Admin Mode to upload CSV files.', type: 'error' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        const existingMap = new Map(leads.map(l => [l.id, l]));
        
        parsed.forEach(p => {
          if (existingMap.has(p.id)) {
            const ex = existingMap.get(p.id);
            // RECENTLY CHANGED: Preserve or update timings when merging duplicate/existing leads
            existingMap.set(p.id, { 
              ...ex, 
              ...p, 
              lat: p.lat || ex.lat, 
              lng: p.lng || ex.lng,
              monday: p.monday || ex.monday,
              tuesday: p.tuesday || ex.tuesday,
              wednesday: p.wednesday || ex.wednesday,
              thursday: p.thursday || ex.thursday,
              friday: p.friday || ex.friday,
              saturday: p.saturday || ex.saturday,
              sunday: p.sunday || ex.sunday,
              status: ex.status, 
              replied: ex.replied 
            });
          } else { 
            existingMap.set(p.id, p); 
          }
        });
        
        setLeads(Array.from(existingMap.values()));
        setUploadStatus({ msg: `✅ Leads staged with coordinates and timings. Use 'Force Cloud Sync' to save!`, type: 'success' });
      } catch (err) { setUploadStatus({ msg: `❌ Upload failed.`, type: 'error' }); }
    };
    reader.readAsText(file, "utf-8");
  };

  const handleSmartCleanup = async () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode.");
    setUploadStatus({ msg: "Cleaning...", type: "loading" });
    const uniqueMap = new Map();
    leads.forEach(lead => {
      const key = lead.name.toLowerCase().trim();
      if (uniqueMap.has(key)) {
        const existing = uniqueMap.get(key);
        // RECENTLY CHANGED: Added timings to the smart deduplicator so they aren't lost
        uniqueMap.set(key, { 
          ...existing, 
          phone: existing.phone || lead.phone, 
          email: existing.email || lead.email, 
          lat: existing.lat || lead.lat, 
          lng: existing.lng || lead.lng,
          monday: existing.monday || lead.monday,
          tuesday: existing.tuesday || lead.tuesday,
          wednesday: existing.wednesday || lead.wednesday,
          thursday: existing.thursday || lead.thursday,
          friday: existing.friday || lead.friday,
          saturday: existing.saturday || lead.saturday,
          sunday: existing.sunday || lead.sunday,
        });
      } else { uniqueMap.set(key, { ...lead }); }
    });
    const cleanedLeads = Array.from(uniqueMap.values());
    setLeads(cleanedLeads);
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanedLeads) });
      const fileContent = `const FALLBACK_LEADS = ${JSON.stringify(cleanedLeads, null, 2)};\n\nexport default FALLBACK_LEADS;`;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([fileContent], { type: 'application/javascript' }));
      a.download = 'fallback-leads-cleaned.js'; a.click();
      setUploadStatus({ msg: `✅ Cleaned and Cloud updated!`, type: 'success' });
    } catch (err) { setUploadStatus({ msg: `❌ Cloud sync error.`, type: 'error' }); }
  };

  const saveDailyGoal = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode to change the daily goal.");
    const val = Math.max(1, Math.min(200, goalInput));
    setDailyData({ ...dailyData, goal: val });
    alert(`🎯 Goal updated to ${val} per day.`);
  };

  const resetAllStatuses = () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode.");
    if (window.confirm("Reset ALL status tags?")) setLeads(leads.map(l => ({ ...l, status: 'none', replied: false })));
  };

  const resetLeadsData = async () => {
    if (!isAdmin) return alert("🔒 Unlock Admin Mode.");
    if (window.confirm("NUKE THE CLOUD?")) {
      try {
        await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([]) });
        setUploadStatus({ msg: "✅ Cloud Database Wiped!", type: "success" });
      } catch (e) { setUploadStatus({ msg: `❌ Wipe failed.`, type: 'error' }); }
    }
  };

  return (
    <div id="view-settings" className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          Settings {!isAdmin && <span className="material-symbols-outlined text-slate-300 text-xl">lock</span>}
        </h1>
        <p className="text-sm text-slate-500">Manage leads data, goals, and cloud backups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        
        <div className={`md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all ${!isAdmin ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm">Add or Update Leads from CSV</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enrich leads with coordinates, timings, or metadata. Manual tags are kept.</p>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-wide">Premium Staged Upload</span>
          </div>
          
          <div 
            className={`border-2 rounded-xl p-8 text-center transition-all ${!isAdmin ? 'cursor-not-allowed bg-slate-50 border-slate-200' : isDragging ? 'border-primary bg-primary/5 cursor-pointer' : 'border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer'}`}
            style={{ borderStyle: 'dashed' }}
            onClick={() => isAdmin && document.getElementById('csv-file-input').click()}
            onDragOver={e => { e.preventDefault(); if (isAdmin) setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={e => { e.preventDefault(); setIsDragging(false); if (isAdmin) handleFile(e.dataTransfer.files[0]); }}
          >
            <span className="material-symbols-outlined block mb-2 text-primary/40" style={{ fontSize: '36px' }}>{isAdmin ? 'upload_file' : 'lock'}</span>
            <p className="text-sm font-semibold text-slate-500">Drop CSV here or <span className="text-primary font-bold">click to browse</span></p>
            <input type="file" id="csv-file-input" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={!isAdmin} />
          </div>
          
          {uploadStatus.msg && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              {uploadStatus.msg}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${!isAdmin ? 'opacity-60' : ''}`}>
          <h3 className="font-bold text-sm mb-3">Target & Goals</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Daily Outreach Goal</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={goalInput} 
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-primary/40"
                />
                <button onClick={saveDailyGoal} disabled={!isAdmin} className="bg-slate-900 text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm ${!isAdmin ? 'opacity-60' : ''}`}>
          <h3 className="font-bold text-sm mb-1">Data Management</h3>
          <p className="text-xs text-slate-400 mb-4">Sync statuses to cloud or deduplicate database.</p>
          
          <div className="flex flex-col gap-3">
            <button onClick={handleDeepSync} disabled={!isAdmin} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary font-bold text-sm hover:bg-primary/5">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span> Force Cloud Sync
            </button>
            <button onClick={downloadStatusBackup} disabled={!isAdmin} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> Download Backup JSON
            </button>
            <button onClick={handleSmartCleanup} disabled={!isAdmin} className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cleaning_services</span> Smart Deduplicate
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm md:col-span-2 lg:col-span-1">
          <h3 className="font-bold text-sm mb-3">Current Dataset Status</h3>
          <div className="space-y-3 text-xs text-slate-500">
            <div className="flex justify-between"><span>Total leads loaded</span><span className="font-bold text-slate-800">{stats.total}</span></div>
            <div className="flex justify-between"><span>Manually Tagged</span><span className="font-bold text-emerald-600">{stats.tagged}</span></div>
            <div className="flex justify-between"><span>Unique Categories</span><span className="font-bold text-slate-800">{stats.categories}</span></div>
            
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-end mb-1.5">
                <span className="font-semibold">Vercel KV Payload Size</span>
                <span className={`font-black ${stats.kb > 800 ? 'text-red-500' : stats.kb > 500 ? 'text-amber-500' : 'text-primary'}`}>
                  {stats.sizeDisplay}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${stats.kb > 800 ? 'bg-red-500' : stats.kb > 500 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${stats.percentOfLimit}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 text-right">Max serverless limit: ~1024 KB (1MB)</p>
            </div>
          </div>
        </div>

        <div className={`md:col-span-2 bg-white rounded-xl border border-red-100 p-5 shadow-sm ${!isAdmin ? 'opacity-60' : ''}`}>
          <h3 className="font-bold text-sm mb-1 text-red-600 font-black flex items-center gap-2">
            <span className="material-symbols-outlined" style={{fontSize: '18px'}}>warning</span>
            Danger Zone
          </h3>
          <p className="text-xs text-slate-400 mb-3">These actions affect all connected devices and cannot be reversed.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={resetAllStatuses} disabled={!isAdmin} className="flex-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">Reset all status tags</button>
            <button onClick={resetLeadsData} disabled={!isAdmin} className="flex-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">Wipe leads from cloud</button>
          </div>
        </div>
      </div>
    </div>
  );
}