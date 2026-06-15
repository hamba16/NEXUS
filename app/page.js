'use client';
import { useState } from 'react';
import Landing      from './components/Landing';
import Sidebar      from './components/Sidebar';
import Topbar       from './components/Topbar';
import SecretariatView from './components/SecretariatView';
import MDAView      from './components/MDAView';
import FieldView    from './components/FieldView';
import ConvenerView from './components/ConvenerView';
import { OversightView } from './components/OversightView';
import { NPAView }  from './components/NPAView';

const DEFAULT_TAB = {
  secretariat: 'dashboard',
  mda:         'dashboard',
  field:       'dashboard',
  convener:    'dashboard',
  oversight:   'dashboard',
  npa:         'dashboard',
};

const PAGE_META = {
  secretariat: {
    dashboard:     { title:'Executive Dashboard',       sub:'Consolidated Q4 FY2025/26 performance view' },
    directives:    { title:'All 23 Directives',         sub:'Presidential Directive Implementation Register' },
    briefing:      { title:'AI Presidential Brief',     sub:'Claude-powered cabinet briefing generation' },
    field:         { title:'Field Verifications',       sub:'On-the-ground verification reports' },
    discrepancies: { title:'Discrepancy Register',      sub:'Variance flags across all MDAs' },
    users:         { title:'System Users',              sub:'APEX NEXUS access management' },
  },
  mda: {
    dashboard: { title:'My Directives — MoWT',   sub:'Ministry of Works & Transport' },
    submit:    { title:'Submit Progress Report',  sub:'Dispatch to DSEMR for verification' },
    history:   { title:'Submission History',      sub:'All reports filed by MoWT' },
    kpis:      { title:'My KPIs',                 sub:'Performance against all assigned targets' },
  },
  field: {
    dashboard: { title:'Active Field Missions',   sub:'OPM Field Verification Unit' },
    verify:    { title:'New Verification',        sub:'Submit on-site GPS-confirmed report' },
    reports:   { title:'Filed Reports',           sub:'All verification reports by your team' },
  },
  convener: {
    dashboard: { title:'National Overview',       sub:'State House Executive Brief — Q4 FY2025/26' },
    map:       { title:'Uganda Map View',         sub:'Regional implementation status across 11 regions' },
    brief:     { title:'Executive Summary',       sub:'Presidential brief for Cabinet session 16 Jun 2026' },
    ndp:       { title:'NDP III Pillar Alignment',sub:'Performance against Uganda\'s five strategic pillars' },
  },
  oversight: {
    dashboard:     { title:'Oversight Summary',  sub:'IGG — Discrepancy monitoring FY 2025/26' },
    discrepancies: { title:'Discrepancy Register',sub:'All variance flags between reported and verified data' },
    audit:         { title:'Audit Trail',        sub:'Chronological log of all flagged events' },
    mdas:          { title:'MDA Risk Ratings',   sub:'IG risk classification across all MDAs' },
  },
  npa: {
    dashboard:   { title:'NDP III Dashboard',        sub:'National Planning Authority — Cross-sector monitoring' },
    pillars:     { title:'Pillar Performance',       sub:'Five NDP III strategic pillars — detailed view' },
    directives:  { title:'Directive → Pillar Mapping',sub:'All 23 directives mapped to NDP III' },
    projections: { title:'Outcome Projections',     sub:'NPA trajectory to NDP III end FY2029/30' },
  },
};

export default function Home() {
  const [role, setRole]   = useState(null);
  const [tab,  setTab]    = useState('dashboard');

  const selectRole = (r) => { setRole(r); setTab(DEFAULT_TAB[r.id] || 'dashboard'); };
  const logout     = () => { setRole(null); setTab('dashboard'); };

  if (!role) return <Landing onSelectRole={selectRole} />;

  const meta = PAGE_META[role.id]?.[tab] || { title: 'APEX NEXUS', sub: '' };

  const renderView = () => {
    switch (role.id) {
      case 'secretariat': return <SecretariatView tab={tab} />;
      case 'mda':         return <MDAView         tab={tab} />;
      case 'field':       return <FieldView        tab={tab} />;
      case 'convener':    return <ConvenerView     tab={tab} />;
      case 'oversight':   return <OversightView    tab={tab} />;
      case 'npa':         return <NPAView          tab={tab} />;
      default:            return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role={role} activeTab={tab} onTabChange={setTab} onLogout={logout} />
      <div className="main-content">
        <Topbar role={role} pageTitle={meta.title} subtitle={meta.sub} />
        <div style={{ flex: 1, overflowY: 'auto', background: '#F9F7F4' }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
