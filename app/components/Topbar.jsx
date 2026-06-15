'use client';
import { useState } from 'react';
import { NOTIFICATIONS } from '../data/seed';

export default function Topbar({ role, pageTitle, subtitle }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  const TYPE_COLOR = { RED: '#EF4444', AMBER: '#F59E0B', BLUE: '#3B82F6' };

  return (
    <div className="topbar">
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', fontFamily: '"Playfair Display", serif' }}>{pageTitle}</h2>
        {subtitle && <p style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Date badge */}
        <div style={{ padding: '4px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: 11, fontWeight: 600, color: '#64748B', letterSpacing: 0.3 }}>
          Q4 · FY 2025/26
        </div>

        {/* Score badge */}
        <div style={{ padding: '4px 12px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>
          Score: 63.7
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: showNotifs ? '#F1F5F9' : 'transparent',
              border: '1px solid', borderColor: showNotifs ? '#E2E8F0' : 'transparent',
              cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 8, height: 8, background: '#EF4444',
                borderRadius: '50%', border: '1.5px solid white',
              }} />
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: 44,
              width: 340, background: 'white', borderRadius: 12,
              border: '1px solid #E2E8F0', boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>Notifications</span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{unread} unread</span>
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {NOTIFICATIONS.map(n => (
                  <div key={n.id} style={{
                    padding: '11px 16px', borderBottom: '1px solid #F8FAFC',
                    background: n.read ? 'transparent' : '#FAFBFF',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: TYPE_COLOR[n.type] || '#94A3B8',
                      opacity: n.read ? 0.4 : 1,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: n.read ? '#64748B' : '#1E293B', fontWeight: n.read ? 400 : 500, lineHeight: 1.4 }}>{n.title}</div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9' }}>
                <button onClick={() => setShowNotifs(false)} style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        {role && (
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: role.color + '25',
            border: `1.5px solid ${role.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: role.color, cursor: 'default',
          }}>
            {role.avatar}
          </div>
        )}
      </div>
    </div>
  );
}
