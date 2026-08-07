import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, LayersControl, CircleMarker, Popup, useMap, ZoomControl } from "react-leaflet";

export function colorForSpecies(name) {
  if (!name) return "#f59e0b";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 68% 58%)`;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [map]);
  return null;
}

export default function PatternsMap({ finds, center }) {
  return (
    <MapContainer center={center} zoom={9} maxZoom={18} className="h-full w-full" zoomControl={false} attributionControl={false}>
      <MapResizer />
      <ZoomControl position="bottomright" />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite (canopy)">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={19} maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Hunter Hybrid">
          <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={16} maxZoom={18} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Hillshade (elevation)">
          <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefMap/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={14} maxZoom={18} />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay name="Streams &amp; water">
          <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={16} maxZoom={18} opacity={0.8} />
        </LayersControl.Overlay>
      </LayersControl>

      {finds.map((f) => {
        const color = colorForSpecies(f.species_name);
        const r = 4 + Math.min(f.quantity || 1, 12) / 2;
        return (
          <CircleMarker key={f.id} center={[f.lat, f.lng]} radius={r} pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 2 }}>
            <Popup>
              <div className="text-xs space-y-0.5 min-w-[140px]">
                <div className="font-semibold text-stone-100">{f.species_name || "Find"}</div>
                <div className="text-stone-300">{f.found_date}{f.quantity ? ` · ${f.quantity} found` : ""}</div>
                {f.elevation_ft != null && <div>Elevation: {Math.round(f.elevation_ft).toLocaleString()} ft</div>}
                {f.aspect && <div>Aspect: {f.aspect}</div>}
                {f.slope_deg != null && <div>Slope: {f.slope_deg.toFixed(0)}°</div>}
                {f.soil_temp_f != null && <div>4" soil: {f.soil_temp_f.toFixed(0)}°F</div>}
                {f.soil_moisture != null && <div>Moisture: {(f.soil_moisture * 100).toFixed(0)}%</div>}
                {f.rain_7d_in != null && <div>Rain 7d: {f.rain_7d_in.toFixed(1)}"</div>}
                {f.habitat_notes && <div className="pt-1 text-stone-300">{f.habitat_notes}</div>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}