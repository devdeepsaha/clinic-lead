import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapController from './MapController';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
}

export default function LeadMap({ mappableLeads, selectedMapLead, markerRefs, getStatusColor, onViewInDirectory }) {
  const center = mappableLeads.length > 0 ? [mappableLeads[0].lat, mappableLeads[0].lng] : [20, 77];

  // RECENTLY CHANGED: Sort leads so 'none' (gray) markers are rendered first (bottom layer)
  // and colored status markers are rendered last (top layer).
  const sortedLeads = [...mappableLeads].sort((a, b) => {
    if (a.status === 'none' && b.status !== 'none') return -1;
    if (a.status !== 'none' && b.status === 'none') return 1;
    return 0;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-4 select-text">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div>
          <h3 className="text-base font-bold text-slate-800">Geographic Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">{mappableLeads.length} leads with location data</p>
        </div>
        <span className="material-symbols-outlined text-slate-300">public</span>
      </div>
      
      <div className="w-full h-[300px] lg:h-[500px] relative z-0">
        {mappableLeads.length > 0 ? (
          <MapContainer 
            center={center} 
            zoom={5} 
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer 
               url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
               attribution='&copy; CARTO'
            />
            
            <MapResizer />
            <MapController selectedLead={selectedMapLead} markerRefs={markerRefs} />

            {/* Use sortedLeads instead of mappableLeads */}
            {sortedLeads.map(l => (
              <CircleMarker 
                key={l.id} 
                center={[l.lat, l.lng]} 
                radius={l.status === 'none' ? 5 : 7} // RECENTLY CHANGED: Make colored dots slightly larger
                ref={(r) => { if(r) markerRefs.current[l.id] = r; }} 
                pathOptions={{ 
                  color: getStatusColor(l.status), 
                  fillColor: getStatusColor(l.status), 
                  fillOpacity: l.status === 'none' ? 0.4 : 0.9, // RECENTLY CHANGED: Dim gray dots, pop colored ones
                  weight: l.status === 'none' ? 1 : 2 
                }}
              >
                <Popup className="rounded-lg">
                  <div className="font-display min-w-[150px] select-text">
                    <p className="font-bold text-slate-800 text-sm mb-1">{l.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">{l.category}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase" style={{ backgroundColor: getStatusColor(l.status) }}>
                      {l.status === 'none' ? 'Untagged' : l.status.replace('_', ' ')}
                    </span>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                      <button onClick={(e) => { e.stopPropagation(); onViewInDirectory(l); }} className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline">
                        View in Directory <span className="material-symbols-outlined" style={{fontSize: '14px'}}>arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">location_off</span>
            <p className="text-sm font-semibold">No location data found</p>
          </div>
        )}
      </div>
    </div>
  );
}