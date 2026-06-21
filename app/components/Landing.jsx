'use client';
import { ROLES } from '../data/seed';

const UGANDA_PARLIAMENT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Parliament-Of-Uganda.JPG';

export default function Landing({ onSelectRole }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F172A' }}>
      {/* Left — Hero Image */}
      <div style={{
        flex: '0 0 44%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <img
          src={UGANDA_PARLIAMENT_IMG}
          alt="Parliament of Uganda, Kampala"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.3) 60%, rgba(15,23,42,0.7) 100%)',
        }} />
        {/* Uganda flag colours strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #000000 0%, #FCDC04 33%, #DE3108 67%, #FFFFFF 85%, #DE3108 100%)',
        }} />
        {/* Text overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6, padding: '4px 12px', marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 }}>LIVE — FY 2025/26 Q4</span>
          </div>
          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 44,
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Presidential<br />Directive<br />Intelligence
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 280 }}>
            Executive Oversight & Monitoring Platform for Uganda's 23 Presidential Directives under NDP III
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
            {[{ v: 23, l: 'Active Directives' }, { v: '63.7', l: 'National Score' }, { v: 146, l: 'Districts Covered' }].map(item => (
              <div key={item.l}>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 500, color: '#FFFFFF', letterSpacing: -1 }}>{item.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Role Selection */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 56px',
        background: '#0F172A',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #1E40AF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0.5 }}>
              APEX NEXUS
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748B' }}>Select your access role to continue</p>
        </div>

        <div style={{
          marginBottom: 20,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          color: '#475569',
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          all data used has been audited for realistic verification,{' '}
          <a
            href="/data-audit.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#64748B', textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 500 }}
          >
            see audit
          </a>
        </div>

        <h2 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 26, fontWeight: 700,
          color: '#F1F5F9', marginBottom: 8,
        }}>
          Who are you today?
        </h2>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 32 }}>
          Each role provides a tailored view of Uganda's directive execution landscape.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '18px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = `${role.color}60`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: role.bg + '20',
                  border: `1px solid ${role.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: role.color,
                  flexShrink: 0,
                }}>
                  {role.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{role.name}</div>
                  <div style={{ fontSize: 10, color: role.color, fontWeight: 600 }}>{role.abbr}</div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#CBD5E1' }}>{role.label}</div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{role.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            CLASSIFIED — SECRET / CABINET OFFICE. Access logged. For authorised GOU personnel only.
          </div>
        </div>
      </div>
    </div>
  );
}
