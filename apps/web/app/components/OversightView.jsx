'use client';
import { useState } from 'react';
import { DISCREPANCIES, DIRECTIVES, FIELD_REPORTS } from '../data/seed';

const SEV = { HIGH:{c:'#DC2626',bg:'#FEF2F2',b:'#FECACA'}, MEDIUM:{c:'#D97706',bg:'#FFFBEB',b:'#FDE68A'}, LOW:{c:'#059669',bg:'#ECFDF5',b:'#A7F3D0'} };
const ST  = { OPEN:'rag-red', UNDER_REVIEW:'rag-amber', ESCALATED:'rag-red', RESOLVED:'rag-green' };

const MDA_RISK = [
  {mda:'MoD',risk:'HIGH',open:2,variance:168,last:'2026-05-15'},
  {mda:'MGLSD',risk:'HIGH',open:2,variance:9.4,last:'2026-05-22'},
  {mda:'IGG',risk:'HIGH',open:1,variance:1.2,last:'2026-04-18'},
  {mda:'NFA',risk:'MEDIUM',open:1,variance:24,last:'2026-06-04'},
  {mda:'MOWT/UNRA',risk:'MEDIUM',open:1,variance:0,last:'2026-05-30'},
  {mda:'NMS/MoH',risk:'MEDIUM',open:1,variance:0,last:'2026-06-01'},
  {mda:'UTB',risk:'LOW',open:0,variance:10,last:'2026-04-20'},
  {mda:'YLP Secretariat',risk:'MEDIUM',open:1,variance:14,last:'2026-05-14'},
];

export function OversightView({ tab }) {
  const [sel, setSel] = useState(null);
  const open     = DISCREPANCIES.filter(d=>d.status!=='RESOLVED').length;
  const high     = DISCREPANCIES.filter(d=>d.severity==='HIGH').length;
  const totalGap = DISCREPANCIES.reduce((s,d)=>s+(d.variance<0?Math.abs(d.variance):0),0);

  if (tab==='dashboard') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Oversight Summary</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>Inspectorate of Government — Discrepancy & Variance Monitoring · FY 2025/26</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[{v:open,l:'Open Discrepancies',c:'#DC2626'},{v:high,l:'High Severity',c:'#DC2626'},{v:`${totalGap.toFixed(1)}B`,l:'Total Financial Gap (UGX)',c:'#D97706'},{v:'1',l:'Resolved This Quarter',c:'#059669'}].map(s=>(
          <div key={s.l} className="card" style={{padding:'18px 20px'}}>
            <div style={{fontSize:10,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:0.6,marginBottom:8}}>{s.l}</div>
            <div className="kpi-value" style={{color:s.c,fontSize:28}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {DISCREPANCIES.slice(0,4).map(d=>{
          const sv=SEV[d.severity];
          return (
            <div key={d.id} className="card" onClick={()=>setSel(d)} style={{padding:'16px 22px',cursor:'pointer',borderLeft:`3px solid ${sv.c}`,transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                    <span style={{fontFamily:'"DM Mono",monospace',fontSize:10.5,color:'#94A3B8'}}>{d.id}</span>
                    <span style={{fontSize:10,fontWeight:700,color:sv.c,background:sv.bg,border:`1px solid ${sv.b}`,padding:'1px 7px',borderRadius:4}}>{d.severity}</span>
                    <span className={`rag ${ST[d.status]||'rag-grey'}`}><span className="rag-dot"/>{d.status.replace('_',' ')}</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:600,color:'#1E293B'}}>{d.title}</div>
                  <div style={{fontSize:11.5,color:'#64748B',marginTop:2}}>{d.mda} · {d.type}</div>
                </div>
                {d.variance!==0&&<div style={{textAlign:'right',flexShrink:0,marginLeft:16}}>
                  <div style={{fontFamily:'"DM Mono",monospace',fontSize:22,fontWeight:500,color:'#DC2626'}}>{d.variance}B</div>
                  <div style={{fontSize:10,color:'#94A3B8'}}>UGX Variance</div>
                </div>}
              </div>
            </div>
          );
        })}
      </div>
      {sel&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="modal-box" style={{maxWidth:660}}>
            <div style={{padding:'24px 28px',borderBottom:'1px solid #F1F5F9'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{display:'flex',gap:8,marginBottom:6}}>
                    <span style={{fontFamily:'"DM Mono",monospace',fontSize:11,color:'#94A3B8'}}>{sel.id}</span>
                    <span style={{fontSize:11,fontWeight:700,color:SEV[sel.severity]?.c,background:SEV[sel.severity]?.bg,border:`1px solid ${SEV[sel.severity]?.b}`,padding:'1px 8px',borderRadius:4}}>{sel.severity}</span>
                  </div>
                  <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:20,fontWeight:700,color:'#1E293B'}}>{sel.title}</h3>
                </div>
                <button onClick={()=>setSel(null)} style={{background:'#F1F5F9',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div style={{padding:'24px 28px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
                {[{l:'MDA',v:sel.mda},{l:'Type',v:sel.type},{l:'Detected',v:sel.detected},{l:'Reported (UGX B)',v:sel.reported_amount},{l:'Verified (UGX B)',v:sel.verified_amount},{l:'Variance',v:`${sel.variance}B`}].map(i=>(
                  <div key={i.l} style={{background:'#F8F9FB',borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontSize:10,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:0.4,marginBottom:3}}>{i.l}</div>
                    <div style={{fontSize:13,fontWeight:600,color:'#1E293B'}}>{i.v}</div>
                  </div>
                ))}
              </div>
              <p style={{fontSize:13,color:'#374151',lineHeight:1.7,marginBottom:16}}>{sel.description}</p>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>Evidence</div>
                {sel.evidence.map(e=><span key={e} className="tag tag-slate" style={{marginRight:6,marginBottom:6,display:'inline-block'}}>{e}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (tab==='discrepancies') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Full Discrepancy Register</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>All flagged variances between MDA-reported and field-verified data</p>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Title</th><th>MDA</th><th>Severity</th><th>Variance (UGX B)</th><th>Status</th><th>Detected</th></tr></thead>
          <tbody>{DISCREPANCIES.map(d=>{
            const sv=SEV[d.severity];
            return (<tr key={d.id} onClick={()=>setSel(d)} style={{cursor:'pointer'}}>
              <td><span style={{fontFamily:'"DM Mono",monospace',fontSize:11,color:'#94A3B8'}}>{d.id}</span></td>
              <td><div style={{fontSize:13,fontWeight:500,color:'#1E293B'}}>{d.title}</div><div style={{fontSize:10.5,color:'#94A3B8'}}>{d.type}</div></td>
              <td><span className="tag tag-blue">{d.mda}</span></td>
              <td><span style={{fontSize:11,fontWeight:700,color:sv.c,background:sv.bg,border:`1px solid ${sv.b}`,padding:'2px 8px',borderRadius:4}}>{d.severity}</span></td>
              <td><span style={{fontFamily:'"DM Mono",monospace',fontSize:12,color:d.variance<0?'#DC2626':'#059669',fontWeight:500}}>{d.variance!==0?`${d.variance}B`:'—'}</span></td>
              <td><span className={`rag ${ST[d.status]||'rag-grey'}`}><span className="rag-dot"/>{d.status.replace('_',' ')}</span></td>
              <td><span style={{fontSize:12,color:'#94A3B8'}}>{d.detected}</span></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
      {sel&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="modal-box"><div style={{padding:28}}><h3 style={{fontFamily:'"Playfair Display",serif',fontSize:18,fontWeight:700,color:'#1E293B',marginBottom:16}}>{sel.title}</h3><p style={{fontSize:13,color:'#374151',lineHeight:1.7}}>{sel.description}</p><button onClick={()=>setSel(null)} className="btn btn-primary btn-sm" style={{marginTop:16}}>Close</button></div></div>
        </div>
      )}
    </div>
  );

  if (tab==='audit') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Audit Trail</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>Chronological log of all system actions and verified field events</p>
      </div>
      <div className="card" style={{padding:'20px 24px'}}>
        {[
          {t:'Field report FR-2026-112 submitted — 23 stockouts flagged',u:'Grace Atim',d:'2026-06-01 14:22',c:'red'},
          {t:'DX-008 opened — NFA tree planting satellite discrepancy',u:'NEMA Audit',d:'2026-06-04 09:15',c:'amber'},
          {t:'DX-007 resolved — URA LTO recovered UGX 10B accommodation levy',u:'URA LTO',d:'2026-05-20 16:40',c:'green'},
          {t:'DX-004 escalated to State House Anti-Corruption Unit',u:'IGG Office',d:'2026-05-08 11:00',c:'red'},
          {t:'Q4 FY2026 reports submission window opened',u:'DSEMR System',d:'2026-06-01 00:00',c:'blue'},
          {t:'AI Briefing generated for 12 June Cabinet session',u:'Sarah Kakande',d:'2026-06-10 08:45',c:'blue'},
          {t:'Field report FR-2026-074 verified — Doho Irrigation confirmed',u:'David Wabwire',d:'2026-05-22 15:30',c:'green'},
        ].map((e,i)=>{
          const c={red:'#EF4444',amber:'#F59E0B',green:'#10B981',blue:'#3B82F6'}[e.c];
          return (
            <div key={i} style={{display:'flex',gap:14,paddingBottom:14,marginBottom:14,borderBottom:i<6?'1px solid #F8FAFC':'none'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:c,marginTop:5,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:'#1E293B',fontWeight:500}}>{e.t}</div>
                <div style={{fontSize:11,color:'#94A3B8',marginTop:3}}>{e.u} · {e.d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (tab==='mdas') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>MDA Risk Ratings</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>IG risk classification of all MDAs with active discrepancies</p>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <table className="data-table">
          <thead><tr><th>MDA</th><th>IG Risk Rating</th><th>Open Cases</th><th>Financial Variance (UGX B)</th><th>Last Reviewed</th><th>Action</th></tr></thead>
          <tbody>{MDA_RISK.map(m=>{
            const c={HIGH:'#DC2626',MEDIUM:'#D97706',LOW:'#059669'}[m.risk];
            return (<tr key={m.mda}>
              <td><span style={{fontSize:13,fontWeight:600,color:'#1E293B'}}>{m.mda}</span></td>
              <td><span style={{fontSize:11,fontWeight:700,color:c,background:c+'15',border:`1px solid ${c}40`,padding:'2px 10px',borderRadius:20}}>{m.risk}</span></td>
              <td><span style={{fontFamily:'"DM Mono",monospace',fontSize:13,color:m.open>0?'#DC2626':'#059669'}}>{m.open}</span></td>
              <td><span style={{fontFamily:'"DM Mono",monospace',fontSize:12,color:m.variance>0?'#DC2626':'#94A3B8'}}>{m.variance>0?`-${m.variance}B`:'—'}</span></td>
              <td><span style={{fontSize:12,color:'#94A3B8'}}>{m.last}</span></td>
              <td><button className="btn btn-ghost btn-sm" style={{fontSize:11}}>Audit</button></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
  );
  return null;
}
