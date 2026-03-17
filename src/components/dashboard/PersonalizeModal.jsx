import React, { useState, useEffect } from 'react';

export default function PersonalizeModal({ isOpen, onClose, onGenerate, lead, status }) {
  const [thought, setThought] = useState('');
  const [screenshots, setScreenshots] = useState([]); // RECENTLY CHANGED: Now an array
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to process files into Base64 and append to the list
  const processFile = (file) => {
  if (!file || !file.type.startsWith('image/')) return;

  if (screenshots.length >= 3) {
    alert("Maximum 3 images allowed for analysis.");
    return;
  }

  const img = new Image();
  const reader = new FileReader();

  reader.onload = (event) => {
    img.src = event.target.result;
  };

  img.onload = () => {
    const MAX_WIDTH = 900; // perfect size for AI analysis
    const scale = Math.min(1, MAX_WIDTH / img.width);

    const canvas = document.createElement("canvas");
    canvas.width = MAX_WIDTH;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/jpeg", 0.8);

    setScreenshots(prev => [...prev, {
      id: Date.now() + Math.random(),
      data: compressed.split(',')[1],
      type: "image/jpeg",
      preview: compressed
    }]);
  };

  reader.readAsDataURL(file);
};
    

  // RECENTLY CHANGED: Multi-image Paste Listener
  useEffect(() => {
    const handlePaste = (e) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            processFile(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, screenshots.length]); // Re-bind when list length changes

  if (!isOpen) return null;

  const QUICK_TAGS = [
    { label: "⚡ Slow Load", value: "I noticed your site takes about 9 seconds to load, which might be frustrating for guests." },
    { label: "📱 Mobile UI", value: "The mobile version of your site has some layout issues that make it hard to navigate." },
    { label: "❌ No Website", value: "I noticed you don't have a website yet, which is a missed opportunity for bookings." },
    { label: "🎨 Dated", value: "The design feels a bit dated and doesn't quite reflect the high quality of your work." },
    { label: "⭐ Reputation", value: `You have an amazing reputation with ${lead?.reviews} reviews, but the site doesn't show it off.` }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!thought.trim() && screenshots.length === 0) return;
    
    setIsGenerating(true);
    
    // RECENTLY CHANGED: Passing the full array of images to the backend
    await onGenerate(thought, {
      rating: lead?.rating,
      reviews: lead?.reviews,
      hasWebsite: !!lead?.website,
      images: screenshots.map(s => ({ data: s.data, type: s.type }))
    });
    
    setIsGenerating(false);
    setThought('');
    setScreenshots([]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Multi-Visual Analysis</h3>
            <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
          </div>
          
          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Lead</p>
              <p className="text-sm font-bold text-slate-700">{lead?.name} <span className="text-primary mx-1">/</span> {status}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                <span className="material-symbols-outlined !text-[14px]">star</span>
                {lead?.rating || 'N/A'}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{lead?.reviews || 0} Reviews</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Helper Tags</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setThought(tag.value)}
                  className="text-[10px] font-bold py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:border-primary/50 hover:text-primary transition-all shadow-sm"
                >
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Detailed Observation</label>
                <textarea
                  autoFocus
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="Paste screenshots (Ctrl+V) or type observations..."
                  className="w-full h-24 p-4 rounded-xl border-2 border-slate-100 focus:border-primary/30 outline-none text-sm transition-all resize-none"
                />
              </div>

              {/* RECENTLY CHANGED: Multi-Screenshot Preview Grid */}
              <div className="grid grid-cols-3 gap-3">
                {screenshots.map((s) => (
                  <div key={s.id} className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary/20 bg-slate-50 flex items-center justify-center group">
                    <img src={s.preview} alt="Preview" className="h-full w-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setScreenshots(prev => prev.filter(img => img.id !== s.id))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined !text-[12px]">close</span>
                    </button>
                  </div>
                ))}
                
                {screenshots.length < 3 && (
                  <label className="aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-primary/30 transition-all">
                    <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Add Image</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => processFile(e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isGenerating || (!thought.trim() && screenshots.length === 0)}
                className="flex-[2] bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>temp_preferences_custom</span>
                )}
                {isGenerating ? 'Analyzing Images...' : `Generate Hook (${screenshots.length})`}
              </button>
            </div>
          </form>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">
            {screenshots.length > 0 ? `${screenshots.length} images ready for visual analysis` : "Text-only mode"}
          </p>
        </div>
      </div>
    </div>
  );
}