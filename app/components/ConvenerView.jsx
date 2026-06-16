'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DIRECTIVES, REGIONS, QUARTERLY_TREND, PILLAR_PERFORMANCE } from '../data/seed';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const green = DIRECTIVES.filter(d=>d.rag==='GREEN').length;
const amber = DIRECTIVES.filter(d=>d.rag==='AMBER').length;
const red   = DIRECTIVES.filter(d=>d.rag==='RED').length;

// Real Leaflet map — loaded client-side only (Leaflet needs `window`).
const UgandaMap = dynamic(() => import('./UgandaMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#EAF2FB', borderRadius:10, color:'#94A3B8', fontSize:12 }}>
      Loading map…
    </div>
  ),
});

const TT = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return <div style={{background:'white',border:'1px solid #E2E8F0',borderRadius:8,padding:'8px 12px',fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
    <div style={{fontWeight:600,marginBottom:4,color:'#1E293B'}}>{label}</div>
    {payload.map(p=><div key={p.name} style={{color:'#64748B'}}>{p.name}: <strong style={{color:'#1E293B'}}>{p.value}</strong></div>)}
  </div>;
};

export default function ConvenerView({ tab }) {
  const [hovered, setHovered] = useState(null);
  const hoveredRegion = REGIONS.find(r=>r.name===hovered);

  const radarData = PILLAR_PERFORMANCE.map(p=>({ subject: p.pillar.split('–')[0].trim(), actual: p.actual, target: p.target }));

  if (tab==='dashboard') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>National Executive Overview</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>State House, Nakasero · Q4 FY 2025/26 · For the Attention of H.E. the President</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[{v:green,l:'Directives On Track',c:'#059669'},{v:amber,l:'Require Attention',c:'#D97706'},{v:red,l:'Critical — Escalate',c:'#DC2626'},{v:'63.7',l:'National Score /100',c:'#7C3AED'}].map(s=>(
          <div key={s.l} className="card" style={{padding:'18px 20px'}}>
            <div style={{fontSize:10,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:0.6,marginBottom:8}}>{s.l}</div>
            <div className="kpi-value" style={{color:s.c,fontSize:30}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:16,marginBottom:16}}>
        {/* Map */}
        <div className="card" style={{padding:'20px',position:'relative',minHeight:420}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:2}}>Uganda — Directive Status by Region</div>
          <div style={{fontSize:11,color:'#94A3B8',marginBottom:12}}>Hover a region for summary</div>
          <div style={{display:'flex',gap:10,marginBottom:12}}>
            {[['GREEN','On Track','#10B981'],['AMBER','At Risk','#F59E0B'],['RED','Critical','#EF4444']].map(([k,l,c])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#64748B'}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:c}}/>{l}
              </div>
            ))}
          </div>
          <div style={{height:360}}><UgandaMap regions={REGIONS} onHover={setHovered} hovered={hovered}/></div>
          {hoveredRegion && (
            <div style={{position:'absolute',bottom:20,left:20,right:20,background:'white',borderRadius:10,border:'1px solid #E2E8F0',padding:'14px 16px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#1E293B'}}>{hoveredRegion.name}</div>
                  <div style={{fontSize:11,color:'#94A3B8',marginTop:2}}>Pop: {(hoveredRegion.population/1000000).toFixed(1)}M · {hoveredRegion.directives} directives tracked</div>
                </div>
                <span className={`rag rag-${hoveredRegion.rag.toLowerCase()}`}><span className="rag-dot"/>{hoveredRegion.rag==='GREEN'?'On Track':hoveredRegion.rag==='AMBER'?'At Risk':'Critical'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{padding:'20px 22px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:4}}>NDP III Pillar Scores</div>
            <div style={{fontSize:11,color:'#94A3B8',marginBottom:12}}>Actual vs target completion %</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={PILLAR_PERFORMANCE} layout="vertical" barSize={10}>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="pillar" tick={{fontSize:9,fill:'#94A3B8'}} axisLine={false} tickLine={false} width={80}
                  tickFormatter={v=>v.split('–')[0].trim()}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="target" name="Target" fill="#EFF6FF" radius={[0,4,4,0]}/>
                <Bar dataKey="actual" name="Actual" radius={[0,4,4,0]}>
                  {PILLAR_PERFORMANCE.map((p,i)=><Cell key={i} fill={p.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{padding:'20px 22px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:12}}>Directives Requiring Escalation</div>
            {DIRECTIVES.filter(d=>d.rag==='RED').map(d=>(
              <div key={d.id} style={{padding:'10px 0',borderBottom:'1px solid #F8FAFC'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:'#DC2626'}}>{d.title}</div>
                    <div style={{fontSize:10.5,color:'#94A3B8',marginTop:1}}>{d.id} · {d.lead_mda} · {d.completion}%</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (tab==='map') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Uganda — Full Map View</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>Regional implementation status — all 11 tracked regions</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div className="card" style={{padding:'24px',height:560}}>
          <UgandaMap regions={REGIONS} onHover={setHovered} hovered={hovered}/>
        </div>
        <div className="card" style={{padding:'20px 22px',overflowY:'auto'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:14}}>Region Summary</div>
          {REGIONS.map(r=>(
            <div key={r.name} style={{padding:'10px 0',borderBottom:'1px solid #F8FAFC',cursor:'pointer'}}
              onMouseEnter={()=>setHovered(r.name)} onMouseLeave={()=>setHovered(null)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'#1E293B'}}>{r.name}</div>
                  <div style={{fontSize:10.5,color:'#94A3B8',marginTop:1}}>{r.directives} directives · {(r.population/1000000).toFixed(1)}M people</div>
                </div>
                <span className={`rag rag-${r.rag.toLowerCase()}`} style={{fontSize:10}}>
                  <span className="rag-dot"/>{r.rag==='GREEN'?'On Track':r.rag==='AMBER'?'At Risk':'Critical'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (tab==='brief') return (
    <div className="view-enter" style={{padding:'28px 28px 40px',maxWidth:860}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>Executive Summary</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>Q4 FY 2025/26 — Prepared for H.E. the President</p>
      </div>
      <div className="card" style={{padding:'32px 36px'}}>
        <div style={{textAlign:'center',borderBottom:'2px solid #0F172A',paddingBottom:20,marginBottom:24}}>
          <div style={{fontSize:10,fontWeight:700,color:'#DC2626',letterSpacing:2,marginBottom:6}}>CLASSIFIED — CABINET IN CONFIDENCE</div>
          <div style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:800,color:'#0F172A',marginBottom:4}}>OFFICE OF THE PRESIDENT — REPUBLIC OF UGANDA</div>
          <div style={{fontSize:13,color:'#64748B'}}>Presidential Directive Implementation — Q4 FY 2025/26 Executive Summary</div>
        </div>
        {[
          {h:'Overall Performance',t:`Uganda's 23 Presidential Directives recorded a composite national score of 63.7/100 in Q4 FY2025/26, an improvement of 2.3 points from Q3 (61.4). Nine directives are On Track (GREEN), ten require monitoring attention (AMBER), and four are in a Critical state requiring Presidential intervention (RED).`},
          {h:'Areas of Excellence',t:`The Tourism and Agriculture sectors have performed exceptionally. International tourist arrivals reached 1.72 million, exceeding the annual target of 1.6 million and generating USD 2.1 billion in revenue. Coffee export earnings hit a historic high of USD 1.1 billion. Karuma Hydropower Station (600MW) entered full commercial operation in Q2, significantly improving grid stability.`},
          {h:'Critical Escalations',t:`Four directives require immediate Presidential attention: (1) Corruption Eradication — CPI score of 26 against a target of 30; prosecution rates fell to 34%; (2) National Security Modernisation — a UGX 168B procurement gap identified by OAG, with cyber defence infrastructure delayed; (3) Gender Equity — UWEP fund released at only 34% of allocation; (4) Disability Inclusion — PWD Fund at 27.5% release, with systemic infrastructure non-compliance.`},
          {h:'Key Recommendations',t:`The Secretariat recommends the following for Presidential directive: (i) Direct the Attorney General to expedite NHIS legislation; (ii) Convene an emergency security procurement review chaired by State House; (iii) Direct MoFPED to release UWEP and PWD allocations within 14 days; (iv) Commission an independent audit of EACOP contractor compliance following international litigation risks.`},
        ].map(s=>(
          <div key={s.h} style={{marginBottom:22}}>
            <div style={{fontFamily:'"Playfair Display",serif',fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:8,paddingLeft:12,borderLeft:'3px solid #1E40AF'}}>{s.h}</div>
            <p style={{fontSize:13.5,color:'#374151',lineHeight:1.9,fontFamily:'"Playfair Display",serif'}}>{s.t}</p>
          </div>
        ))}
        <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid #E2E8F0',display:'flex',justifyContent:'space-between',fontSize:12,color:'#94A3B8'}}>
          <span>Prepared by: Sarah Kakande, PS — DSEMR</span>
          <span>Date: 15 June 2026</span>
        </div>
      </div>
    </div>
  );

  if (tab==='ndp') return (
    <div className="view-enter" style={{padding:'28px 28px 40px'}}>
      <div style={{marginBottom:24}}>
        <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:22,fontWeight:700,color:'#1E293B',marginBottom:4}}>NDP III Pillar Alignment</h3>
        <p style={{fontSize:13,color:'#94A3B8'}}>Performance against Uganda's five National Development Plan III Strategic Pillars</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div className="card" style={{padding:'20px 22px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:14}}>Pillar Performance Radar</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0"/>
              <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:'#64748B'}}/>
              <Radar name="Target" dataKey="target" stroke="#CBD5E1" fill="#E2E8F0" fillOpacity={0.4}/>
              <Radar name="Actual" dataKey="actual" stroke="#1E40AF" fill="#1E40AF" fillOpacity={0.25}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:'20px 22px'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#1E293B',marginBottom:14}}>Pillar Detail</div>
          {PILLAR_PERFORMANCE.map(p=>(
            <div key={p.pillar} style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:600,color:'#1E293B'}}>{p.pillar}</span>
                <span style={{fontFamily:'"DM Mono",monospace',fontSize:12,color:p.actual>=p.target?'#059669':'#D97706'}}>{p.actual}%</span>
              </div>
              <div className="progress-track">
                <div style={{height:'100%',width:`${p.actual}%`,background:p.color,borderRadius:99}}/>
              </div>
              <div style={{fontSize:10,color:'#94A3B8',marginTop:3}}>Target {p.target}% · {p.directives} directives · Gap: {p.target-p.actual}pp</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}
