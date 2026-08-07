import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, LayersControl, Marker, CircleMarker, Circle, Polyline, Popup, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";

const pin = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.25),0 0 14px rgba(52,211,153,.9)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function ClickHandler({ onPick, mode, onMeasureClick }) {
  useMapEvents({
    click: (e) => {
      if (mode) onMeasureClick(e.latlng);
      else onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Keeps the map's internal size in sync with its flex container and re-paints
// once after mount — prevents the grey/white tiles and misaligned map that
// happen when the layout shifts or the map initialises before sizing settles.
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

const fmtMi = (m) => (m < 160 ? `${Math.round(m / 0.3048)} ft` : `${(m / 1609.34).toFixed(2)} mi`);

export default function MapCanvas({ center, target, finds = [], onPick, mode, measurePts, onMeasureClick, area }) {
  return (
    <MapContainer center={center} zoom={11} maxZoom={18} className="h-full w-full" zoomControl={false} attributionControl={false}>
      <MapResizer />
      <ZoomControl position="bottomright" />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Hunter Hybrid">
          <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={16} maxZoom={18} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Topographic">
          <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" maxNativeZoom={17} maxZoom={18} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={19} maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay name="Streams &amp; water">
          <TileLayer url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}" maxNativeZoom={16} maxZoom={18} opacity={0.85} />
        </LayersControl.Overlay>
      </LayersControl>
      <ClickHandler onPick={onPick} mode={mode} onMeasureClick={onMeasureClick} />

      {target && <Marker position={[target.lat, target.lng]} icon={pin} />}

      {mode === "distance" && measurePts.length > 1 && (
        <Polyline positions={measurePts.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#34d399", weight: 2, dashArray: "5 6" }} />
      )}
      {mode === "distance" &&
        measurePts.map((p, i) => (
          <CircleMarker key={i} center={[p.lat, p.lng]} radius={4} pathOptions={{ color: "#34d399", fillColor: "#34d399", fillOpacity: 1 }}>
            <Popup>{i === 0 ? "Start" : `Point ${i + 1}`}</Popup>
          </CircleMarker>
        ))}

      {mode === "area" && area && (
        <Circle center={[area.lat, area.lng]} radius={area.radiusM} pathOptions={{ color: "#fbbf24", weight: 2, fillColor: "#fbbf24", fillOpacity: 0.08 }} />
      )}

      {finds.map((f) => (
        <CircleMarker key={f.id} center={[f.lat, f.lng]} radius={6} pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.7, weight: 2 }}>
          <Popup>
            <div className="text-xs">
              <div className="font-semibold">{f.species_name || "Find"}</div>
              <div>{f.found_date}</div>
              {f.quantity ? <div>{f.quantity} found</div> : null}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export { fmtMi };