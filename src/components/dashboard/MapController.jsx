import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapController({ selectedLead, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    // Check if we have a valid lead with coordinates
    if (selectedLead && selectedLead.lat && selectedLead.lng) {
      // RECENTLY CHANGED: Fly to the lead with a smooth animation and high zoom (16)
      map.flyTo([selectedLead.lat, selectedLead.lng], 16, {
        animate: true,
        duration: 1.5
      });

      // Automatically open the popup for this specific lead
      const marker = markerRefs.current[selectedLead.id];
      if (marker) {
        // Delay slightly to wait for the map movement to stabilize
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  }, [selectedLead, map, markerRefs]);

  return null; // This component doesn't render anything, it just controls the map
}