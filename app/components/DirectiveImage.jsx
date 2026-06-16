'use client';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────
//  DirectiveImage
//  A resilient banner for a Presidential Directive.
//  • Always renders a themed gradient banner (sector-coloured, with an
//    icon + label) so something meaningful displays even with no network.
//  • Layers a real thematic photo on top that fades in once it loads.
//    If the photo 404s or the network is unavailable, the banner remains —
//    the UI never shows a broken-image icon.
//
//  This replaces the previous approach of hot-linking fabricated Wikipedia
//  URLs (which 404'd) directly into <img> tags.
// ─────────────────────────────────────────────────────────────

// Sector → { gradient, accent, icon (emoji), photo (Unsplash) }
// Unsplash images.unsplash.com URLs are CORS/hot-link friendly and stable.
const SECTOR_THEME = {
  'Economic Development': { from: '#0F766E', to: '#10B981', icon: '🏭', photo: 'photo-1565008447742-97f6f38c985c' },
  'Agriculture':          { from: '#15803D', to: '#65A30D', icon: '🌾', photo: 'photo-1500382017468-9049fed747ef' },
  'Infrastructure':       { from: '#1E40AF', to: '#3B82F6', icon: '🛣️', photo: 'photo-1545459720-aac8509eb02c' },
  'Services':             { from: '#0E7490', to: '#22D3EE', icon: '🦍', photo: 'photo-1521651201144-634f700b36ef' },
  'Finance':              { from: '#155E75', to: '#0EA5E9', icon: '💳', photo: 'photo-1554224155-6726b3ff858f' },
  'Extractives':          { from: '#78350F', to: '#D97706', icon: '⛏️', photo: 'photo-1518709268805-4e9042af2176' },
  'Social Development':   { from: '#9D174D', to: '#EC4899', icon: '🎓', photo: 'photo-1497486751825-1233686d5d80' },
  'ICT':                  { from: '#4338CA', to: '#6366F1', icon: '💻', photo: 'photo-1518770660439-4636190af475' },
  'Environment':          { from: '#166534', to: '#22C55E', icon: '🌳', photo: 'photo-1472214103451-9374bd1c798e' },
  'Urban Development':    { from: '#1E3A5F', to: '#64748B', icon: '🏙️', photo: 'photo-1449824913935-59a10b8d2000' },
  'Governance':           { from: '#3730A3', to: '#818CF8', icon: '⚖️', photo: 'photo-1589829085413-56de8ae18c73' },
  'Security':             { from: '#7F1D1D', to: '#DC2626', icon: '🛡️', photo: 'photo-1579912437766-7896df6d3cd3' },
  'Security & Justice':   { from: '#7F1D1D', to: '#B91C1C', icon: '🕊️', photo: 'photo-1589578527966-fdac0f44566c' },
  'International Relations': { from: '#1E40AF', to: '#0EA5E9', icon: '🌍', photo: 'photo-1526778548025-fa2f459cd5c1' },
};

const DEFAULT_THEME = { from: '#1E293B', to: '#475569', icon: '📋', photo: 'photo-1454165804606-c3d57bc86b40' };

function buildPhotoUrl(theme, explicit) {
  if (explicit) return explicit;
  return `https://images.unsplash.com/${theme.photo}?auto=format&fit=crop&w=1200&q=70`;
}

export default function DirectiveImage({ directive, height = 160, rounded = true, showLabel = true }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const theme = SECTOR_THEME[directive?.sector] || DEFAULT_THEME;
  const photoUrl = buildPhotoUrl(theme, directive?.image);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: rounded ? 12 : 0,
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
      }}
    >
      {/* Subtle texture so the banner reads as a designed surface, not a flat block */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 80% -10%, rgba(255,255,255,0.18), transparent 55%)',
      }} />

      {/* Real photo — fades in over the banner once it loads; hidden on error */}
      {!failed && (
        <img
          src={photoUrl}
          alt={directive?.title || 'Directive'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      )}

      {/* Legibility scrim + label */}
      {showLabel && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.15) 55%, rgba(15,23,42,0.05) 100%)',
          }} />
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{theme.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
                {directive?.sector}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {directive?.title}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
