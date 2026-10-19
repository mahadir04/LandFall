# Landfall

> **AI Financial Assistant for International Students arriving in China**
> Built for the 2026 Shenzhen International FinTech Competition, Topic C.

[![Simulated](https://img.shields.io/badge/environment-simulated-orange)](.)
[![Competition](https://img.shields.io/badge/competition-Shenzhen%20FinTech%202026-blue)](.)

---

## What is Landfall?

Landfall is an AI agent that gets an international student **financially landed** in a new country. It builds a dated plan of money tasks (visa funds proof, tuition, rent deposit, bank account, first card), checks payees and routes before money moves, manages two currencies, and walks the student toward a credit history.

**Persona: Priya** — 22, master's student arriving in Shenzhen, India → China, INR → CNY.

**All payments are SIMULATED. No real money moves. No real user data is used.**

---

## Features

| Feature | Description |
|---------|-------------|
| 📋 Critical Path Planner | Dependency graph with slack calculation |
| ✅ Payee Verification | CNAPS registry check before any payment |
| 🛡 Scam Shield | Rule-based signal scoring — BLOCK / WARN / ALLOW |
| 💱 Route Comparison | SWIFT vs UnionPay vs WeChat Pay by total cost |
| 📈 FX Shock Replay | -8% scenario replay with plan re-adjustment |
| 📄 Document Checklist | Per-bank requirements (ICBC, BOC, CMB) |
| ⭐ Credit Path | 6-step PBOC milestone tracker |
| 🔐 Audit Log | SHA-256 hash-chained tamper-evident log |
| 🤖 AI Chat | Rule-grounded responses with source citations |
| 📊 Eval Report | Metrics for competition submission |

---

## Quick Start

### 1. Backend (FastAPI)

```bash
cd landfall

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start the backend
python -m uvicorn backend.api.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 2. Frontend (React + Vite)

```bash
cd landfall/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## Project Structure

```
landfall/
├── backend/
│   └── api/
│       └── main.py          # FastAPI app — all endpoints
├── frontend/
│   └── src/
│       ├── App.jsx           # All React screens + Chat
│       └── index.css         # Complete design system
├── data/
│   ├── registry.json         # Synthetic payee registry
│   ├── providers.json        # Mock FX providers
│   ├── fx/                   # INR/CNY FX scenario CSVs
│   └── rules/
│       └── rules.json        # 16 sourced Chinese regulatory rules
├── eval/
│   ├── scenarios/            # 25 YAML evaluation scenarios
│   └── attacks/              # ~30 attack/red-team cases
├── docs/
│   └── PRD_TRD.md            # Complete PRD + TRD document
├── requirements.txt
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/profile` | Create student profile |
| GET | `/plan` | Critical path milestones |
| POST | `/plan/replan` | Re-plan after FX shock |
| POST | `/quotes` | Compare remittance routes |
| POST | `/payee/verify` | Verify payee against registry |
| POST | `/scam/check` | Run scam shield analysis |
| POST | `/confirm` | Issue T3 confirmation token |
| POST | `/simulate/pay` | Execute simulated payment |
| POST | `/fx/scenario` | Run FX scenario replay |
| GET | `/docs/check` | Document readiness per bank |
| GET | `/credit/path` | PBOC credit milestones |
| GET | `/audit` | Tamper-evident audit log |
| GET | `/audit/verify` | Verify hash chain integrity |
| GET | `/eval/report` | Evaluation metrics report |
| POST | `/chat` | AI chat with source citations |

---

## Security Architecture

```
Permission Tiers:
  T0 Read     — Rulebook lookups, FX quotes     → Automatic
  T1 Plan     — Build/change plan, no effects   → Automatic
  T2 Draft    — Emails, checklists              → Automatic (marked draft)
  T3 Execute  — Simulated payment               → Requires confirmation token
  T4 Forbidden— Real credentials, unverified    → Always denied

Taint Rule: Documents tagged origin=doc CANNOT trigger tool calls.

Policy Gate: Plain Python (no LLM) validates every T3 action.
Verifier: Every figure → result_id. Every rule → rule_id. Abstain if missing.
Audit Log: SHA-256 hash chain. GET /audit/verify detects tampering.
```

---

## Competition Context

- **Competition:** 2026 Shenzhen International FinTech Competition
- **Track:** International, Topic C — Cross-border & Student Finance
- **Deadline:** 20 October 2026, 23:59 Beijing time
- **Host Country:** China (CNY)
- **Demo Persona:** Priya, India → Shenzhen, INR → CNY

---

## Disclaimer

This is a **simulated environment** built for a student competition. All payments, bank integrations, exchange rates, and regulatory lookups are simulated or illustrative. No real financial transactions occur. Always consult official sources and licensed financial professionals for real financial decisions.

---

## License

MIT
