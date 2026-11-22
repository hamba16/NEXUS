import { DIRECTIVES } from '../../data/seed';

// ─────────────────────────────────────────────────────────────
//  POST /api/briefing
//  Server-side AI Presidential Briefing generator.
//
//  The previous implementation called https://api.anthropic.com directly
//  from the browser, which always failed (no API key could be exposed
//  client-side, no version header, and the browser is blocked by CORS).
//
//  This route runs server-side:
//    • If ANTHROPIC_API_KEY is set in the environment, it calls Claude
//      (Opus 4.8, adaptive thinking) via the official SDK.
//    • Otherwise it returns a high-quality, deterministic briefing
//      composed from the live directive data — so the tool is always
//      functional, key or no key.
// ─────────────────────────────────────────────────────────────

export const runtime = 'nodejs';

const green = DIRECTIVES.filter(d => d.rag === 'GREEN');
const amber = DIRECTIVES.filter(d => d.rag === 'AMBER');
const red   = DIRECTIVES.filter(d => d.rag === 'RED');

const FOCUS_DIRECTIVE = {
  full:    'Produce a complete, balanced briefing covering performance across all sectors.',
  red:     'Focus specifically on the directives in a Critical (RED) state requiring immediate Presidential intervention. Keep coverage of on-track areas brief.',
  economy: 'Focus on economic performance — industrial transformation, agriculture, tourism, trade, financial inclusion, and private-sector development — and their contribution to the national score.',
};

const SYSTEM_PROMPT = `You draft an explicitly SIMULATED exhibition briefing for the Directorate of Socio-Economic Monitoring and Research (DSEMR), Office of the President. All supplied operational figures, findings and legacy directive categories are unverified demo fixtures, not real claims. Do not present them as verified facts or attribute them to real individuals. Start the response with SIMULATED OPERATIONAL DATA — UNAPPROVED EXHIBITION EXAMPLE.

Your briefings are:
- Written in formal Ugandan government English
- Structured with clear sections: Executive Summary, Key Highlights, Areas Requiring Presidential Attention, Recommendations
- Specific — use the real data provided
- Balanced — acknowledge progress while being frank about failures
- Approximately 500-700 words
- Addressed to H.E. the President of Uganda
- Never use bullet points — only formal paragraphs and numbered recommendations`;

function buildUserPrompt(focus) {
  const ontrack = green.map(d => d.title).join(', ');
  const critical = red.map(d => d.title).join(', ');
  return `Generate a classified Presidential Briefing for H.E. President Yoweri Kaguta Museveni for the Cabinet Meeting scheduled 16 June 2026.

FOCUS FOR THIS BRIEFING: ${FOCUS_DIRECTIVE[focus] || FOCUS_DIRECTIVE.full}

DATA — Q4 FY 2025/26:
- Total Presidential Directives: 23
- On Track (GREEN): ${green.length} — ${ontrack}
- At Risk (AMBER): ${amber.length}
- Critical (RED): ${red.length} — ${critical}
- National Composite Score: 63.7/100 (up from 61.4 in Q3)
- Budget Under Monitoring: UGX 14.6 Trillion across all MDAs

HIGHLIGHTS:
- Tourism revenues exceeded target: USD 2.1B (target USD 1.8B); 1.72M international arrivals
- Coffee exports reached USD 1.1B — record high
- Karuma Hydropower (600MW) now fully commercial
- EACOP pipeline 7% behind schedule due to international litigation
- National Health Insurance Scheme Bill stalled in Parliament
- Youth unemployment at 18.2% against 13.5% target
- Corruption KPIs missed for second consecutive quarter
- Defence procurement: UGX 168B gap identified between reported and verified spending
- UWEP fund disbursement at only 34% of allocation

Write the complete Presidential Briefing now.`;
}

// Deterministic, data-driven briefing used when no API key is configured.
function buildTemplateBriefing(focus) {
  const ontrack = green.map(d => d.title).join(', ');
  const critical = red.map(d => `${d.title} (${d.id}, ${d.completion}% complete)`).join('; ');

  const summary = `EXECUTIVE SUMMARY

Mr. President, Uganda's twenty-three Presidential Directives under the National Development Plan III recorded a composite national score of 63.7 out of 100 in the fourth quarter of FY 2025/26, an improvement of 2.3 points over the third-quarter score of 61.4. Of the directives under monitoring, ${green.length} are On Track, ${amber.length} require sustained monitoring attention, and ${red.length} are in a Critical state requiring direct Presidential intervention. A total budget of UGX 14.6 trillion remains under active monitoring across all Ministries, Departments and Agencies.`;

  const highlights = `KEY HIGHLIGHTS

The Tourism and Agriculture sectors have continued to outperform their targets. International tourist arrivals reached 1.72 million against an annual target of 1.6 million, generating USD 2.1 billion in revenue. Coffee export earnings attained a historic high of USD 1.1 billion. In the energy sector, the Karuma Hydropower Station, with a capacity of 600 megawatts, has entered full commercial operation, materially improving grid stability. Directives currently On Track include: ${ontrack}.`;

  const attention = `AREAS REQUIRING PRESIDENTIAL ATTENTION

Four directives demand immediate intervention: ${critical}. In particular, the Inspectorate of Government reports that anti-corruption indicators have been missed for a second consecutive quarter, with the Corruption Perception Index at 26 against a target of 30. The Office of the Auditor General has identified a UGX 168 billion gap between reported and field-verified defence procurement expenditure. The Uganda Women Entrepreneurship Programme has disbursed only 34 per cent of its allocation, and the Persons with Disabilities Fund remains critically under-released. The EACOP pipeline is 7 per cent behind schedule owing to international litigation, and the National Health Insurance Scheme Bill remains stalled in Parliament.`;

  const recommendations = `RECOMMENDATIONS

The Secretariat respectfully submits the following for Your Excellency's directive. First, that the Attorney General be directed to expedite the National Health Insurance Scheme legislation. Second, that an emergency security-procurement review be convened under the chairmanship of State House to resolve the verified expenditure variance. Third, that the Ministry of Finance be directed to release the outstanding Uganda Women Entrepreneurship Programme and Persons with Disabilities Fund allocations within fourteen days. Fourth, that an independent audit of EACOP contractor compliance be commissioned in light of the prevailing international litigation risk.

Prepared by Sarah Kakande, Principal Secretary — DSEMR, Office of the Prime Minister. Classified — Cabinet in Confidence.`;

  if (focus === 'red') {
    return [summary, attention, recommendations].join('\n\n');
  }
  if (focus === 'economy') {
    const econ = `ECONOMIC PERFORMANCE

The productive sectors anchor the quarter's gains. Manufacturing and agro-processing continue to expand the export basket, coffee earnings have reached USD 1.1 billion, and tourism receipts of USD 2.1 billion have exceeded target. Financial inclusion now stands at 73 per cent, the highest on record. However, private-sector competitiveness remains constrained: the Ease of Doing Business ranking, tax-to-GDP performance and youth employment all trail their targets, with youth unemployment at 18.2 per cent against a 13.5 per cent target.`;
    return [summary, econ, highlights, recommendations].join('\n\n');
  }
  return [summary, highlights, attention, recommendations].join('\n\n');
}

export async function POST(request) {
  let focus = 'full';
  try {
    const body = await request.json();
    if (body && typeof body.focus === 'string') focus = body.focus;
  } catch {
    // no/invalid body — default to full briefing
  }

  // No API key → return a deterministic, data-driven briefing.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ briefing: 'SIMULATED OPERATIONAL DATA — UNAPPROVED EXHIBITION EXAMPLE\n\n' + buildTemplateBriefing(focus), source: 'template', is_simulated: true });
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 3000,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(focus) }],
    });
    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();
    return Response.json({ briefing: 'SIMULATED OPERATIONAL DATA — UNAPPROVED EXHIBITION EXAMPLE\n\n' + (text || buildTemplateBriefing(focus)), source: text ? 'claude' : 'template', is_simulated: true });
  } catch (err) {
    // Any API failure falls back to the deterministic briefing so the tool never breaks.
    return Response.json({
      briefing: 'SIMULATED OPERATIONAL DATA — UNAPPROVED EXHIBITION EXAMPLE\n\n' + buildTemplateBriefing(focus),
      is_simulated: true,
      source: 'template',
      note: 'AI service unavailable; generated from unverified exhibition fixtures.',
    });
  }
}
