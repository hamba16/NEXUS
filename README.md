<div align="center">

# ⚡ APEX NEXUS

### Executive Oversight Intelligence Platform
**Republic of Uganda — Office of the President**

*Built by VAIS Applied Intelligence Systems*

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude_Sonnet-D97757?style=for-the-badge&logo=anthropic&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

</div>

---

APEX Nexus is a government-grade executive oversight intelligence platform that digitises Uganda's presidential directive tracking cycle — from MDA quarterly submissions through GPS-verified field evidence to AI-generated presidential briefings. Six institutional roles. Three AI-powered modules. Zero desk-appraisal guesswork.

> This repository is a **research and verification visualization** — every module, role, workflow, and data flow presented reflects the real system design, built for institutional review and stakeholder validation.

---

## ✦ Modules

### 📊 TRACK — Directive Performance Intelligence
Real-time **RAG (Red / Amber / Green)** status dashboards across all 23 Presidential Strategic Directives. MDA Officers submit structured quarterly reports through guided forms; the KPI engine computes performance deltas automatically; Secretariat reviews are accelerated by AI-generated 3–5 point summaries that preserve critical detail without the noise.

### 🛰️ VERIFY — Field Evidence & Discrepancy Engine
Field Monitors deploy an **offline-first PWA** to capture GPS-tagged, photo-documented evidence bundles tied to specific directives — with full functionality on zero network connectivity. Every bundle is **HMAC-SHA256 signed** for tamper-evident integrity. On sync, a discrepancy engine automatically cross-references field observations against MDA self-reports, with Claude surfacing specific contradictions, severity ratings, and escalation recommendations.

### 📋 BRIEF — AI Presidential Briefing Engine
One click. Claude ingests all current directive KPIs, MDA summaries, field evidence outcomes, and discrepancy flags — and produces a formally structured, decision-ready presidential briefing document. Named underperformers. Quantified deviations. Cross-sector patterns. Specific recommended presidential actions. Secretariat approves before the Convener ever sees it.

---

## ✦ Role-Based Access Control

Six roles mapped directly to Uganda's APEX institutional structure, enforced at **three independent layers** — JWT token claims, FastAPI route middleware, and PostgreSQL Row-Level Security. Cross-role data leakage is architecturally impossible.

| Role | Institution | Access |
|------|------------|--------|
| `CONVENER` | President of Uganda | Approved briefings + top-level scorecard only |
| `SECRETARIAT` | DSEMR / Office of President | Full platform — manage, review, approve, escalate |
| `MDA_OFFICER` | Ministries & Agencies | Submit and track own directive reports |
| `FIELD_MONITOR` | DSEMR Field Staff | Capture and sync GPS field evidence |
| `ANCHOR_ENTITY` | NPA / MoFPED / OPM | Cross-sector performance view |
| `OVERSIGHT` | IGG / Anti-Corruption Unit | Discrepancy queue + investigation escalation |

---

## ✦ AI Integration

All AI is powered by **Anthropic Claude (claude-sonnet-4-6)** across three silent endpoints. Users interact with clean UI features — no AI machinery is ever surfaced.

- **Report Summariser** — fires automatically on MDA submission; condenses narrative + KPI data into structured actionable points
- **Discrepancy Analyser** — returns structured JSON with `severity`, `contradictions[]`, and `recommendation` on every evidence sync
- **Presidential Brief Generator** — ingests full platform state snapshot; outputs a complete formally structured briefing in seconds

The `ANTHROPIC_API_KEY` lives server-side only and is never referenced in frontend code or API responses.

---

## ✦ Technical Highlights

**Next.js 14 App Router** with full TypeScript powers the frontend — server components handle role-aware rendering, dynamic imports keep bundles lean across six distinct role views, and a PWA layer gives Field Monitors a fully functional offline experience on any smartphone without an app store. The result is a shell that feels instant under government network conditions.

```
Frontend      Next.js 14 (App Router) · Tailwind CSS · TypeScript · PWA
Backend       FastAPI (Python 3.11) · Async · OpenAPI auto-documented
Database      PostgreSQL 15 · Row-Level Security on every table
Auth          JWT RS256 · Stateless · Role claims embedded in token
AI            Anthropic claude-sonnet-4-6 · 3 structured endpoints
Storage       MinIO (S3-compatible) · Field evidence + briefing PDFs
Infra         NITA-U Government Cloud · Data sovereign deployment
```

---

## ✦ Security Architecture

| Control | Implementation |
|---------|---------------|
| Authentication | JWT RS256 · 8h access token · rotating httpOnly refresh tokens |
| Authorisation | RBAC middleware + PostgreSQL RLS — dual independent enforcement |
| Data Integrity | HMAC-SHA256 signed evidence bundles · server rejects any unsigned data |
| Transport | TLS 1.3 enforced · HTTP redirects to HTTPS |
| AI Key Security | `ANTHROPIC_API_KEY` server-side only · never in frontend or API responses |
| Audit Trail | Immutable timestamps on all submissions, reviews, approvals, and briefing versions |

---

<div align="center">

*VAIS Applied Intelligence Systems — Makerere, Kampala, Uganda*
`CONFIDENTIAL — FOR OFFICIAL USE ONLY`

</div>
