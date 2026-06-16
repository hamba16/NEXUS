'use client';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';

// ─────────────────────────────────────────────────────────────
//  UgandaMap — a real, interactive slippy map (OpenStreetMap tiles)
//  replacing the previous hand-drawn <svg> outline with hard-coded
//  pixel dots. Region status is shown with RAG-coloured CircleMarkers
//  placed at real lat/lng. CircleMarkers are vector shapes, so there
//  are no Leaflet marker-icon image assets that could fail to load.
//
//  Rendered via next/dynamic with { ssr: false } from ConvenerView,
//  because Leaflet touches `window` and cannot server-render.
// ─────────────────────────────────────────────────────────────

const RAG_COLOR = { GREEN: '#10B981', AMBER: '#F59E0B', RED: '#EF4444' };
const RAG_LABEL = { GREEN: 'On Track', AMBER: 'At Risk', RED: 'Critical' };

// Approximate geographic bounds of Uganda — keeps the view locked to the country.
const UGANDA_CENTER = [1.3733, 32.2903];
const UGANDA_BOUNDS = [
  [-1.6, 29.4], // SW
  [4.3, 35.1],  // NE
];

export default function UgandaMap({ regions, onHover, hovered }) {
  return (
    <MapContainer
      center={UGANDA_CENTER}
      zoom={7}
      minZoom={6}
      maxZoom={11}
      maxBounds={UGANDA_BOUNDS}
      maxBoundsViscosity={0.9}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%', borderRadius: 10, background: '#EAF2FB' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {regions.map(r => {
        const color = RAG_COLOR[r.rag] || '#64748B';
        const isHov = hovered === r.name;
        return (
          <CircleMarker
            key={r.name}
            center={[r.lat, r.lng]}
            radius={isHov ? 13 : 9}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              mouseover: () => onHover?.(r.name),
              mouseout: () => onHover?.(null),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 150 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {(r.population / 1000000).toFixed(1)}M people · {r.directives} directives
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 3 }}>
                  ● {RAG_LABEL[r.rag] || r.rag}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
