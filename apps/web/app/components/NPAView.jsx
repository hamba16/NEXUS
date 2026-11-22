'use client';
import { DIRECTIVES, PILLAR_PERFORMANCE, NDP_PILLARS, QUARTERLY_TREND } from '../data/seed';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import { useState } from 'react';
import DirectiveModal from './DirectiveModal';

const TT=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return <div style={{background:'white',border:'1px solid #E2E8F0',borderRadius:8,padding:'8px 12px',fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
    <div style={{fontWeight:600,marginBottom:4,color:'#1E293B'}}>{label}</div>
    {payload.map(p=><div key={p.name} style={{color:'#64748B'}}>{p.name}: <strong style={{color:'#1E293B'}}>{p.value}</strong></div>)}
  </div>;
};

const PROJECTION_DATA = [
  {year:'FY25/26',score:63.7,target:70},{year:'FY26/27',score:69,target:75},{year:'FY27/28',score:74,target:80},
  {year:'FY28/29',score:79,target:85},{year:'FY29/30',score:83,target:90},
];

export function NPAView({ tab }) {
  const [sel, setSel] = useState(null);
  const [pillar, setPillar] = useState(null);

  const pillarDirectives = pillar
    ? DIRECTIVES.filter(d => NDP_PILLARS.find(p=>p.id===pillar)?.directives.includes(d.seq))
    : [];

  if (tab==='dashboard') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>NDP III Monitoring Dashboard</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>National Planning Authority — Cross-sector directive alignment to Uganda Vision 2040 & NDP III</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:22}}>
        {PILLAR_PERFORMANCE.map(p=>(
          <div key={p.pillar} className="card card-hover" style={{padding:'16px 18px',borderTop:`3px solid ${p.color}`,cursor:'pointer'}} onClick={()=>setPillar(NDP_PILLARS.find(x=>x.label.startsWith(p.pillar.split('–')[1]?.trim().slice(0,6)||''))?.id)}>
            <div style={{fontSize:10,fontWeight:600,color:'#94A3B8',marginBottom:6,lineHeight:1.3}}>{p.pillar}</div>
            <div style={{fontFamily:'"DM Mono",monospace',fontSize:24,fontWeight:500,color:p.color,marginBottom:4}}>{p.actual}%</div>
            <div style={{fontSize:10,color:'#94A3B8'}}>Target {p.target}%</div>
            <div className="progress-track" style={{marginTop:8}}>
              <div style={{height:'100%',width:`${p.actual}%`,background:p.color,borderRadius:99}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div className="card" style={{padding:'20px 22px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:4}}>Pillar Score Comparison — Target vs Actual</div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:16}}>FY 2025/26 Q4 · All five NDP III pillars</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PILLAR_PERFORMANCE} barSize={22} barGap={6}>
              <XAxis dataKey="pillar" tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} tickFormatter={v=>v.split('–')[0].trim()}/>
              <YAxis domain={[0,100]} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="target" name="Target" fill="#E2E8F0" radius={[3,3,0,0]}/>
              <Bar dataKey="actual" name="Actual" radius={[3,3,0,0]}>
                {PILLAR_PERFORMANCE.map((p,i)=><Cell key={i} fill={p.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:'20px 22px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:14}}>NDP III Progress Summary</div>
          {[
            {l:'Total Directives',v:'23',c:'#1E40AF'},
            {l:'Ahead of Schedule',v:'3',c:'#059669'},
            {l:'Behind Schedule',v:'14',c:'#D97706'},
            {l:'Off Track',v:'4',c:'#DC2626'},
            {l:'Avg. Completion',v:'52%',c:'#7C3AED'},
            {l:'Budget Released (FY)',v:'UGX 9.4T',c:'#0F766E'},
          ].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #F8FAFC',alignItems:'center'}}>
              <span style={{fontSize:12,color:'#64748B'}}>{s.l}</span>
              <span style={{fontFamily:'"DM Mono",monospace',fontSize:13,fontWeight:500,color:s.c}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>
      {sel&&<DirectiveModal directive={sel} onClose={()=>setSel(null)}/>}
    </div>
  );

  if (tab==='pillars') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>NDP III Pillar Performance</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>Click a pillar to view its associated directives</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {NDP_PILLARS.map((np,i)=>{
          const perf = PILLAR_PERFORMANCE[i];
          const dirs = DIRECTIVES.filter(d=>np.directives.includes(d.seq));
          const isOpen = pillar===np.id;
          return (
            <div key={np.id} className="card" style={{overflow:'hidden'}}>
              <div onClick={()=>setPillar(isOpen?null:np.id)} style={{padding:'18px 22px',cursor:'pointer',display:'flex',alignItems:'center',gap:16,background:isOpen?'#FAFBFF':'white'}}>
                <div style={{width:36,height:36,borderRadius:8,background:perf.color+'20',border:`1.5px solid ${perf.color}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:perf.color,flexShrink:0}}>{np.id}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#1E293B'}}>{np.label}</div>
                  <div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>{dirs.length} directives · {perf.actual}% actual vs {perf.target}% target</div>
                </div>
                <div style={{width:120}}>
                  <div className="progress-track">
                    <div style={{height:'100%',width:`${perf.actual}%`,background:perf.color,borderRadius:99}}/>
                  </div>
                  <div style={{fontSize:10,color:'#94A3B8',marginTop:3,textAlign:'right'}}>{perf.actual}%</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {isOpen&&(
                <div style={{padding:'0 22px 18px',background:'#FAFBFF',borderTop:'1px solid #F1F5F9'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:14}}>
                    {dirs.map(d=>(
                      <div key={d.id} className="card card-hover" style={{padding:'14px 16px'}} onClick={()=>setSel(d)}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                          <span style={{fontFamily:'"DM Mono",monospace',fontSize:10,color:'#94A3B8'}}>{d.id}</span>
                          <span className={`rag rag-${d.rag.toLowerCase()}`}><span className="rag-dot"/>{d.rag==='GREEN'?'On Track':d.rag==='AMBER'?'At Risk':'Critical'}</span>
                        </div>
                        <div style={{fontSize:12,fontWeight:600,color:'#1E293B',marginBottom:6}}>{d.title}</div>
                        <div className="progress-track">
                          <div className={`progress-fill progress-${d.rag.toLowerCase()}`} style={{width:`${d.completion}%`}}/>
                        </div>
                        <div style={{fontSize:10,color:'#94A3B8',marginTop:4}}>{d.completion}% complete · {d.lead_mda}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {sel&&<DirectiveModal directive={sel} onClose={()=>setSel(null)}/>}
    </div>
  );

  if (tab==='directives') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Directive → Pillar Mapping</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>How each Presidential Directive maps to NDP III strategic pillars</p>
      </div>
      <div className="card" style={{overflow:'hidden'}}>
        <table className="data-table">
          <thead><tr><th>Directive</th><th>Title</th><th>NDP Pillar</th><th>Lead MDA</th><th>Status</th><th>Completion</th></tr></thead>
          <tbody>{DIRECTIVES.map(d=>(
            <tr key={d.id} onClick={()=>setSel(d)} style={{cursor:'pointer'}}>
              <td><span style={{fontFamily:'"DM Mono",monospace',fontSize:11,color:'#64748B'}}>{d.id}</span></td>
              <td><span style={{fontSize:13,fontWeight:500,color:'#1E293B'}}>{d.title}</span></td>
              <td><span className="tag tag-violet">{d.ndp_pillar}</span></td>
              <td><span className="tag tag-blue">{d.lead_mda}</span></td>
              <td><span className={`rag rag-${d.rag.toLowerCase()}`}><span className="rag-dot"/>{d.rag==='GREEN'?'On Track':d.rag==='AMBER'?'At Risk':'Critical'}</span></td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="progress-track" style={{width:80}}>
                    <div className={`progress-fill progress-${d.rag.toLowerCase()}`} style={{width:`${d.completion}%`}}/>
                  </div>
                  <span style={{fontSize:11,fontFamily:'"DM Mono",monospace',color:'#64748B'}}>{d.completion}%</span>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {sel&&<DirectiveModal directive={sel} onClose={()=>setSel(null)}/>}
    </div>
  );

  if (tab==='projections') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Outcome Projections</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>NPA projections to end of NDP III cycle — FY 2029/30</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div className="card" style={{padding:'20px 22px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:4}}>National Score Projection — FY2025/26 to FY2029/30</div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:16}}>Trajectory assumes current reform pace; target requires acceleration in P3 and P4</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={PROJECTION_DATA}>
              <XAxis dataKey="year" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
              <YAxis domain={[55,95]} tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Line type="monotone" dataKey="target" name="NDP III Target" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5,4" dot={{fill:'#CBD5E1',r:4}}/>
              <Line type="monotone" dataKey="score" name="Projected Score" stroke="#1E40AF" strokeWidth={2.5} dot={{fill:'#1E40AF',r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:'20px 22px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:14}}>NPA Key Concerns</div>
          {[
            {t:'Human Capital gap widens',d:'P3 gap of 31pp — largest across all pillars. STEM throughput and teacher deployment critical.',c:'#DC2626'},
            {t:'Governance reform pace insufficient',d:'P4 at 49% — corruption & justice reform missing targets by widest margin since NDP II.',c:'#DC2626'},
            {t:'Infrastructure on watch',d:'P2 at 52% — EACOP delay and urban settlement backlogs risk missing NDP III infrastructure targets.',c:'#D97706'},
            {t:'Economy performing',d:'P1 and P5 both within 5pp of target. Tourism and agriculture overperforming — bright spots.',c:'#059669'},
          ].map(c=>(
            <div key={c.t} style={{padding:'10px 0',borderBottom:'1px solid #F8FAFC'}}>
              <div style={{fontSize:12,fontWeight:600,color:c.c,marginBottom:4}}>{c.t}</div>
              <div style={{fontSize:11.5,color:'#64748B',lineHeight:1.4}}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}
