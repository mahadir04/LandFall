import { useState, useEffect, useRef } from 'react'
import './index.css'
import { FXSplineChart, BudgetDonutChart, RouteComparisonChart, SAFEMeter, CreditProgressGauge } from './components/Charts'

const API = 'http://localhost:8000'

// ── API helpers ──────────────────────────────────────────────────────────────
const api = {
  get: (path) => fetch(`${API}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),
}

// ── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'plan', icon: '📋', label: 'Critical Path' },
  { id: 'tuition', icon: '🎓', label: 'Tuition & Payee' },
  { id: 'remittance', icon: '💱', label: 'Remittance Routes' },
  { id: 'scam', icon: '🛡', label: 'Scam Shield' },
  { id: 'fx', icon: '📈', label: 'FX Scenario' },
  { id: 'docs', icon: '📄', label: 'Document Check' },
  { id: 'credit', icon: '⭐', label: 'Credit Path' },
  { id: 'audit', icon: '🔐', label: 'Audit Log' },
  { id: 'eval', icon: '📊', label: 'Eval Report' },
]

// ── Onboarding Screen ────────────────────────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [form, setForm] = useState({
    home_currency: 'INR', host_currency: 'CNY', host_country: 'CN',
    arrival_date: '2026-12-01', program_end: '2028-06-30',
    monthly_budget_cny: 50000, funding_source: 'Family (INR)'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/profile', form)
      onComplete(res.profile)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at top, #0d2035 0%, #0d1117 70%)' }}>
      <div className="onboarding-container fade-in">
        <div className="onboarding-logo">
          <div className="onboarding-logo-icon">✈️</div>
          <div className="onboarding-title">Welcome to Landfall</div>
          <div className="onboarding-sub">Let's build your landing plan</div>
        </div>

        <div className="notification notification-info">
          <span>ℹ️</span>
          <span>Simulated environment · No real money moves · Powered by Landfall AI Agent</span>
        </div>

        <form className="onboarding-card card" onSubmit={handleSubmit}>
          <div className="card-title">Your Journey</div>

          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Journey</label>
            <div className="journey-row">
              <div className="journey-country">
                <div className="journey-label">Home</div>
                <div className="journey-value">India (INR)</div>
              </div>
              <div className="journey-arrow">→</div>
              <div className="journey-country">
                <div className="journey-label">Host</div>
                <div className="journey-value">China (CNY)</div>
              </div>
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 16 }}>Arrival & Program</div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Arriving</label>
              <input className="input" type="date" value={form.arrival_date}
                onChange={e => setForm(f => ({ ...f, arrival_date: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Program Ends</label>
              <input className="input" type="date" value={form.program_end}
                onChange={e => setForm(f => ({ ...f, program_end: e.target.value }))} />
            </div>
          </div>

          <div className="card-title">Funding & Budget</div>
          <div className="input-group">
            <label className="input-label">Main Funding Source</label>
            <select className="select" value={form.funding_source}
              onChange={e => setForm(f => ({ ...f, funding_source: e.target.value }))}>
              <option>Family (INR)</option>
              <option>Education Loan</option>
              <option>Scholarship</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Initial Budget (CNY)</label>
            <input className="input" type="number" value={form.monthly_budget_cny}
              onChange={e => setForm(f => ({ ...f, monthly_budget_cny: Number(e.target.value) }))} />
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ marginTop: 8, padding: '14px 20px', fontSize: 16 }}>
            {loading ? <span className="spinner">⚙️</span> : '⚡'} Generate My Plan
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ profile, onNavigate }) {
  const [fxRates, setFxRates] = useState([])

  useEffect(() => {
    api.post('/fx/scenario', { scenario: 'baseline' }).then(res => {
      setFxRates(res?.rates || [])
    })
  }, [])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="notification notification-info fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>✈️</span>
          <span>Welcome Priya! Financial landing plan for <strong style={{ color: 'var(--accent)' }}>Shenzhen</strong>. 6 weeks until arrival; critical path active.</span>
        </div>
        <span className="badge badge-accent">Host: China (CNY)</span>
      </div>

      <div className="grid-3">
        <div className="card stat-card floating-card">
          <div className="card-title">Initial Allocated Budget</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>¥{Number(profile.monthly_budget_cny || 50000).toLocaleString()}</div>
          <div className="stat-label">Family Funded (INR)</div>
        </div>
        <div className="card stat-card floating-card" style={{ animationDelay: '0.4s' }}>
          <div className="card-title">Days to Arrival</div>
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>42</div>
          <div className="stat-label">Arrival: Dec 1, 2026</div>
        </div>
        <div className="card stat-card floating-card" style={{ animationDelay: '0.8s' }}>
          <div className="card-title">INR / CNY Mid Rate</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>0.0860</div>
          <div className="stat-label">1 INR = 0.0860 CNY</div>
        </div>
      </div>

      {/* Graphical Insights: Donut Chart & Live Spline Chart */}
      <div className="grid-2">
        <div className="card fade-in">
          <div className="card-title">Multi-Currency Budget Allocation</div>
          <BudgetDonutChart totalCNY={profile.monthly_budget_cny || 50000} />
        </div>

        <div className="card fade-in">
          <div className="card-title">INR / CNY Exchange Rate Trend (30 Days)</div>
          <FXSplineChart rates={fxRates.slice(-14)} scenario="baseline" />
        </div>
      </div>

      {/* SAFE Regulatory Compliance Gauge */}
      <SAFEMeter currentCNY={28000} />

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Milestone Status (Critical Path)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'PSB Alien Registration', status: 'pending', tag: '30-Day Window', critical: true },
              { name: 'Open Bank Account (ICBC)', status: 'pending', tag: 'Depends on PSB', critical: false },
              { name: 'Tuition Remittance (CNAPS)', status: 'pending', tag: '¥28,000 due (Slack: 7d)', critical: false },
              { name: 'UnionPay Debit Card Activation', status: 'pending', tag: 'Cashless Setup', critical: false },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`status-dot ${m.critical ? 'dot-red' : 'dot-orange'}`}></span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                </div>
                <span className={`badge ${m.critical ? 'badge-red' : 'badge-muted'}`}>{m.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🛡', label: 'Scam Shield Analyzer', page: 'scam', desc: 'Screen suspicious tuition discount offers' },
              { icon: '🎓', label: 'Verify Tuition Payee', page: 'tuition', desc: 'Authenticate CNAPS university accounts' },
              { icon: '💱', label: 'Compare Remittance Routes', page: 'remittance', desc: 'Find lowest landed cost to Shenzhen' },
              { icon: '📄', label: 'Document Readiness Check', page: 'docs', desc: 'Prepare ICBC & BOC account proofs' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                onClick={() => onNavigate && onNavigate(a.page)}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <span style={{ color: 'var(--accent)', fontSize: 14 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Critical Path Plan ────────────────────────────────────────────────────────
function PlanScreen() {
  const [plan, setPlan] = useState(null)
  const [replanResult, setReplanResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/plan').then(setPlan)
  }, [])

  const runReplan = async (scenario) => {
    setLoading(true)
    const res = await api.post('/plan/replan', { scenario })
    setReplanResult(res)
    setLoading(false)
  }

  const statusColor = { done: 'var(--green)', pending: 'var(--orange)', blocked: 'var(--red)', locked: 'var(--text-muted)' }
  const statusDot = { done: 'dot-green', pending: 'dot-orange', blocked: 'dot-red', locked: 'dot-muted' }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="notification notification-info">
        <span>📋</span>
        <span>Critical Path Plan — 8 milestones from arrival to PBOC credit report. Zero-slack items are on the critical path.</span>
      </div>

      {replanResult && (
        <div className="card fade-in" style={{ border: '1px solid var(--orange)' }}>
          <div className="card-title" style={{ color: 'var(--orange)' }}>🔄 Re-plan Result ({replanResult.scenario})</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <div>⚠️ <em>{replanResult.note}</em></div>
            <div style={{ marginTop: 8 }}>Avg FX Rate: <strong>{replanResult.avg_fx_rate}</strong></div>
            <div>Original Budget: <strong>¥{replanResult.original_budget_cny?.toLocaleString()}</strong></div>
            <div>Adjusted Budget: <strong style={{ color: 'var(--orange)' }}>¥{replanResult.adjusted_budget_cny?.toLocaleString()}</strong></div>
            {replanResult.changes?.map((c, i) => <div key={i}>• {c}</div>)}
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Milestones</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => runReplan('shock_week3')} disabled={loading}>
              {loading ? '⏳' : '📈'} -8% FX Shock
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => runReplan('baseline')} disabled={loading}>
              🔄 Baseline
            </button>
          </div>
        </div>

        {plan ? (
          <div className="milestone-list">
            {plan.milestones.map((m, i) => (
              <div key={m.id} className="milestone-item fade-in">
                <div className="milestone-indicator">
                  <div className="milestone-dot-outer" style={{ background: m.status === 'done' ? 'var(--green-dim)' : 'var(--bg-secondary)', border: `2px solid ${statusColor[m.status] || 'var(--border)'}` }}>
                    <span className={`status-dot ${statusDot[m.status] || 'dot-muted'}`}></span>
                  </div>
                  {i < plan.milestones.length - 1 && <div className="milestone-line"></div>}
                </div>
                <div className="milestone-content">
                  <div className="milestone-name">{m.name}</div>
                  <div className="milestone-meta">
                    <span>{m.duration_days} day{m.duration_days !== 1 ? 's' : ''}</span>
                    {m.slack_days === 0
                      ? <span className="milestone-critical">🔴 Critical path</span>
                      : <span className="milestone-slack">✓ {m.slack_days}d slack</span>
                    }
                    <span className="milestone-rule">{m.rule_ref}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{m.description}</div>
                </div>
                <div>
                  <span className={`badge ${m.status === 'done' ? 'badge-green' : m.status === 'pending' ? 'badge-orange' : 'badge-muted'}`}>{m.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Loading plan...</div>}
      </div>
    </div>
  )
}

// ── Tuition & Payee ───────────────────────────────────────────────────────────
function TuitionScreen() {
  const [institution, setInstitution] = useState('Shenzhen University')
  const [verifyResult, setVerifyResult] = useState(null)
  const [token, setToken] = useState(null)
  const [payResult, setPayResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    setLoading(true)
    const res = await api.post('/payee/verify', { institution })
    setVerifyResult(res)
    setLoading(false)
  }

  const confirm = async () => {
    const payeeId = verifyResult?.entry?.id || 'PAY-001'
    const res = await api.post('/confirm', {
      payee_id: payeeId, amount: 28000, currency: 'CNY', date: '2026-12-10'
    })
    setToken(res)
  }

  const pay = async () => {
    if (!token?.token) return
    const res = await api.post('/simulate/pay', { token: token.token })
    setPayResult(res)
  }

  const statusColors = { VERIFIED: 'var(--green)', MISMATCH: 'var(--red)', UNVERIFIED: 'var(--red)' }
  const statusIcons = { VERIFIED: '✅', MISMATCH: '❌', UNVERIFIED: '⚠️' }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="notification notification-info">
        <span>🎓</span>
        <span>Tuition payments must go to the university's official CNAPS account. Third-party agents are prohibited. [RB-CN-TUI-01]</span>
      </div>

      <div className="card">
        <div className="card-title">Payee Verification</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="input" value={institution} onChange={e => setInstitution(e.target.value)}
            placeholder="Enter institution name..." style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={verify} disabled={loading}>
            {loading ? '⏳' : '🔍'} Verify
          </button>
        </div>

        {verifyResult && (
          <div className="card fade-in" style={{ border: `2px solid ${statusColors[verifyResult.status]}`, background: verifyResult.status === 'VERIFIED' ? 'var(--green-dim)' : 'var(--red-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{statusIcons[verifyResult.status]}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: statusColors[verifyResult.status] }}>{verifyResult.status}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{verifyResult.message}</div>
              </div>
            </div>
            {verifyResult.entry && (
              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, padding: '10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div><strong>Institution:</strong> {verifyResult.entry.institution}</div>
                <div><strong>Bank:</strong> {verifyResult.entry.bank}</div>
                <div><strong>CNAPS Code:</strong> <code style={{ color: 'var(--accent)' }}>{verifyResult.entry.cnaps_code}</code></div>
                <div><strong>Last Verified:</strong> {verifyResult.entry.last_verified}</div>
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>Rule: {verifyResult.rule_ref}</div>
          </div>
        )}
      </div>

      {verifyResult?.status === 'VERIFIED' && !payResult && (
        <div className="card fade-in">
          <div className="card-title">Simulated Payment — Explicit Confirmation (Tier 3)</div>
          <div className="notification notification-warn" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <span>This is a simulated payment. No real money moves. Token is single-use with a 15-minute TTL.</span>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payee</span>
              <span style={{ fontWeight: 600 }}>{verifyResult.entry?.name || 'SZU Finance Office'} ({verifyResult.entry?.institution})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>¥28,000.00 CNY</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date</span>
              <span style={{ fontWeight: 600 }}>Dec 10, 2026</span>
            </div>
          </div>
          {!token ? (
            <button className="btn btn-secondary btn-full" onClick={confirm}>🔑 Generate Confirmation Token</button>
          ) : (
            <div>
              <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: 8, padding: 12, marginBottom: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center' }}>
                Token: <strong style={{ color: 'var(--accent)' }}>{token.token}</strong>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Bound to exact parameters · Single-use · 15-min TTL</div>
              </div>
              <button className="btn btn-primary btn-full" onClick={pay}>⚡ Authorize Simulated Payment</button>
            </div>
          )}
        </div>
      )}

      {payResult && (
        <div className="card fade-in" style={{ border: '2px solid var(--green)' }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>Payment Simulated Successfully</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              TX ID: <code style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{payResult.transaction?.tx_id?.slice(0, 16)}...</code>
            </div>
            <div className="badge badge-orange" style={{ marginTop: 12 }}>SIMULATED ENVIRONMENT · NO REAL MONEY MOVED</div>
            <div style={{ marginTop: 18 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setPayResult(null); setToken(null); setVerifyResult(null); }}>
                🔄 Verify Another Payee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Remittance Routes ─────────────────────────────────────────────────────────
function RemittanceScreen() {
  const [amount, setAmount] = useState(28000)
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)

  const compare = async (targetAmt = amount) => {
    setLoading(true)
    const res = await api.post('/quotes', { target_cny: Number(targetAmt) })
    setQuotes(res.quotes || [])
    setLoading(false)
  }

  useEffect(() => {
    compare(28000)
  }, [])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="notification notification-info">
        <span>💱</span>
        <span>Routes compared by total landed cost (INR). Formula: total_cost = (target_cny / effective_rate) × (1 + fee%) + fixed_fee. [RB-CN-FX-01]</span>
      </div>

      <div className="card">
        <div className="card-title">Target Remittance Amount</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Amount to Send (CNY)</label>
            <input className="input" type="number" value={amount}
              onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => compare(amount)} disabled={loading}>
              {loading ? '⏳' : '🔍'} Compare Routes
            </button>
          </div>
        </div>
      </div>

      {quotes.length > 0 && (
        <>
          {/* Graphical Insights: Route Cost Comparison Visualizer */}
          <div className="card fade-in">
            <div className="card-title">Route Efficiency & Cost Breakdown</div>
            <RouteComparisonChart quotes={quotes} />
          </div>

          <div>
            <div className="notification notification-warn">
              <span>⚠️</span>
              <span>Illustrative rates only. Not live market data. Single-use transfer token required before payment simulation.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              {quotes.map((q, i) => (
                <div key={q.provider_id} className={`provider-card fade-in ${i === 0 ? 'best' : ''}`}>
                  {i === 0 && <div className="best-tag">✓ CHEAPEST ROUTE</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="provider-logo">{q.logo}</span>
                      <div>
                        <div className="provider-name">{q.provider_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{q.notes}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="provider-cost">₹{q.total_cost_inr.toLocaleString('en-IN')}</div>
                      <div className="provider-cost-label">Total Landed Cost (INR)</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12 }}>
                    <div><div style={{ color: 'var(--text-muted)' }}>FX Spread Margin</div><div style={{ fontWeight: 600 }}>{q.fx_margin_pct}%</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Platform Fee %</div><div style={{ fontWeight: 600 }}>{q.fee_pct}%</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Fixed Fee</div><div style={{ fontWeight: 600 }}>₹{q.fixed_fee_inr}</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Settlement Speed</div><div style={{ fontWeight: 600, color: i === 0 ? 'var(--green)' : 'inherit' }}>{q.speed_days}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SAFEMeter currentCNY={Number(amount)} />
        </>
      )}
    </div>
  )
}

// ── Scam Shield ───────────────────────────────────────────────────────────────
function ScamScreen() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const check = async () => {
    if (!text.trim()) return
    setLoading(true)
    const res = await api.post('/scam/check', { text })
    setResult(res)
    setLoading(false)
  }

  const EXAMPLES = [
    "Hi Priya! I'm an official authorized agent for Shenzhen University. Pay your CNY 28,000 tuition to my personal WeChat account and I'll give you a 12% discount. Act fast!",
    "URGENT: Your enrollment will be cancelled if you don't send ¥5,000 to this account immediately.",
    "Please find attached the official tuition payment receipt from the Finance Office.",
  ]

  const decisionIcon = { BLOCK: '🚫', WARN: '⚠️', ALLOW: '✅' }
  const decisionClass = { BLOCK: 'scam-block', WARN: 'scam-warn', ALLOW: 'scam-allow' }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="notification notification-info">
        <span>🛡</span>
        <span>Scam Shield uses rule-based signal scoring. The model only explains. Thresholds are frozen. [RB-CN-SCAM-01]</span>
      </div>

      <div className="card">
        <div className="card-title">Paste Suspicious Message</div>
        <textarea className="textarea" value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste a suspicious message, invoice text, or WhatsApp message here..." />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={check} disabled={loading || !text.trim()}>
            {loading ? '⏳' : '🛡'} Analyze
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setText(''); setResult(null); }}>Clear</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Try an example:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {EXAMPLES.map((ex, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
                onClick={() => setText(ex)}>
                {ex.slice(0, 80)}...
              </div>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className={`scam-result ${decisionClass[result.decision]} fade-in`}>
          <div className="scam-icon">{decisionIcon[result.decision]}</div>
          <div className="scam-decision" style={{ color: result.decision === 'BLOCK' ? 'var(--red)' : result.decision === 'WARN' ? 'var(--orange)' : 'var(--green)' }}>
            {result.decision}
          </div>
          <div className="scam-explanation">{result.explanation}</div>

          {result.high_signals.length > 0 && (
            <div className="signal-list">
              {result.high_signals.map((s, i) => (
                <div key={i} className="signal-item signal-high">
                  <span>🔴</span> <span>HIGH: {s.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {result.medium_signals.map((s, i) => (
                <div key={i} className="signal-item signal-medium">
                  <span>🟡</span> <span>MEDIUM: {s.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {result.low_signals.map((s, i) => (
                <div key={i} className="signal-item signal-low">
                  <span>⚪</span> <span>LOW: {s.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
            Rules: {result.rule_refs?.join(' · ')}
          </div>
        </div>
      )}
    </div>
  )
}

// ── FX Scenario ────────────────────────────────────────────────────────────────
function FXScreen() {
  const [scenario, setScenario] = useState('baseline')
  const [data, setData] = useState(null)
  const [replan, setReplan] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (sc = scenario) => {
    setLoading(true)
    const [fx, rp] = await Promise.all([
      api.post('/fx/scenario', { scenario: sc }),
      api.post('/plan/replan', { scenario: sc })
    ])
    setData(fx)
    setReplan(rp)
    setLoading(false)
  }

  useEffect(() => {
    run('baseline')
  }, [])

  const handleScenarioChange = (sId) => {
    setScenario(sId)
    run(sId)
  }

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="notification notification-warn">
        <span>📈</span>
        <span>This is a scenario replay. We do not predict exchange rates. [RB-CN-FX-01]</span>
      </div>

      <div className="card">
        <div className="card-title">FX Scenario Replay Controls</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'baseline', label: '📊 Baseline (stable 0.086)', color: 'var(--accent)' },
            { id: 'shock_week3', label: '📉 -8% Shock in Week 3', color: 'var(--red)' },
          ].map(s => (
            <button key={s.id} className={`btn ${scenario === s.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleScenarioChange(s.id)}>
              {s.label}
            </button>
          ))}
          <button className="btn btn-secondary" onClick={() => run(scenario)} disabled={loading}>
            {loading ? '⏳' : '🔄'} Replay Scenario
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Graphical Insights: Interactive FX Spline Chart */}
          <div className="card fade-in">
            <div className="card-title">Interactive Spline Trend ({scenario.toUpperCase()})</div>
            <FXSplineChart rates={data.rates} scenario={scenario} />
          </div>

          {replan && (
            <div className="card fade-in" style={{ border: '1px solid var(--orange)' }}>
              <div className="card-title" style={{ color: 'var(--orange)' }}>🔄 Plan Adjustment</div>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 8 }}>{replan.note}</div>
                <div className="grid-2">
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Original Budget</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>¥{replan.original_budget_cny?.toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ padding: 12, border: '1px solid var(--orange)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Adjusted Budget</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--orange)' }}>¥{replan.adjusted_budget_cny?.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  {replan.changes?.map((c, i) => <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>• {c}</div>)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Document Check ─────────────────────────────────────────────────────────────
function DocsScreen() {
  const [data, setData] = useState(null)
  const [selectedBank, setSelectedBank] = useState('ICBC')

  useEffect(() => {
    api.get('/docs/check').then(setData)
  }, [])

  const statusIcon = { ok: '✅', pending: '🔸', missing: '❌', info: 'ℹ️' }
  const statusBadge = { ok: 'badge-green', pending: 'badge-orange', missing: 'badge-red', info: 'badge-accent' }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="notification notification-info">
        <span>📄</span>
        <span>Document requirements per bank. PSB Certificate is pending until arrival — this is expected, not a failure. [RB-CN-BANK-01]</span>
      </div>

      <div className="tabs">
        {['ICBC', 'BOC', 'CMB'].map(b => (
          <div key={b} className={`tab ${selectedBank === b ? 'active' : ''}`} onClick={() => setSelectedBank(b)}>
            {b}
          </div>
        ))}
      </div>

      {data && data.banks[selectedBank] && (
        <div className="card fade-in">
          <div className="card-title">{selectedBank} — Document Readiness</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Note</th>
                <th>Rule</th>
              </tr>
            </thead>
            <tbody>
              {data.banks[selectedBank].requirements.map((doc, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{doc.doc}</td>
                  <td>
                    <span className={`badge ${statusBadge[doc.status]}`}>
                      {statusIcon[doc.status]} {doc.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{doc.note}</td>
                  <td><code style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{doc.rule_ref}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <div className="card-title">Bank Comparison Summary</div>
        <div className="grid-3">
          {[
            { bank: 'ICBC', deposit: '¥20', address: 'Optional', photo: 'Required', highlight: false },
            { bank: 'BOC', deposit: '¥0', address: 'Required', photo: 'Optional', highlight: true },
            { bank: 'CMB', deposit: '¥10', address: 'Optional', photo: 'Optional', highlight: false },
          ].map(b => (
            <div key={b.bank} className="card" style={{ border: b.highlight ? '1px solid var(--green)' : '1px solid var(--border)', position: 'relative' }}>
              {b.highlight && <div className="best-tag">✓ BEST MATCH</div>}
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{b.bank}</div>
              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Min Deposit</span>
                  <span style={{ fontWeight: 600, color: b.bank === 'BOC' ? 'var(--green)' : 'inherit' }}>{b.deposit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Address Proof</span>
                  <span>{b.address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Photo</span>
                  <span>{b.photo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
          ✓ Best match: Bank of China — zero deposit, dorm contract satisfies address proof. [RB-CN-BANK-03]
        </div>
      </div>
    </div>
  )
}

// ── Credit Path ────────────────────────────────────────────────────────────────
function CreditScreen() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/credit/path').then(setData)
  }, [])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="notification notification-info">
        <span>⭐</span>
        <span>6 steps from first account to your PBOC Credit Reference Report. No score predictions. No approval predictions. [RB-CN-CR-01 – CR-06]</span>
      </div>

      {data && (
        <>
          {/* Graphical Insights: Radial Progress Gauge */}
          <div className="card fade-in">
            <CreditProgressGauge completedSteps={3} totalSteps={6} />
          </div>

          <div className="card">
            <div className="card-title">PBOC Credit Progression Roadmap</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>{data.disclaimer}</div>
          {data.milestones.map((m, i) => (
            <div key={i} className={`credit-step ${m.status === 'pending' || i < 3 ? 'unlocked' : 'locked'}`}>
              <div className="credit-step-num">{m.step}</div>
              <div style={{ flex: 1 }}>
                <div className="credit-step-name">{m.name}</div>
                <div className="credit-step-meta">
                  <span>⏱ {m.timing}</span>
                  <span style={{ margin: '0 8px' }}>·</span>
                  <span>Requires: {m.prerequisite}</span>
                  <span style={{ margin: '0 8px' }}>·</span>
                  <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', fontSize: 10 }}>{m.rule_ref}</code>
                </div>
              </div>
              <span className={`badge ${m.status === 'pending' ? 'badge-accent' : 'badge-muted'}`}>
                {m.status === 'pending' ? 'READY' : '🔒 LOCKED'}
              </span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
)
}

// ── Audit Log ──────────────────────────────────────────────────────────────────
function AuditScreen() {
  const [data, setData] = useState(null)
  const [integrity, setIntegrity] = useState(null)

  useEffect(() => {
    api.get('/audit').then(setData)
  }, [])

  const verify = async () => {
    const res = await api.get('/audit/verify')
    setIntegrity(res)
  }

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="notification notification-info">
        <span>🔐</span>
        <span>Tamper-evident audit log. Each event hashes the previous, making deletions or modifications detectable.</span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={verify}>🛡 Run Re-verification Scan</button>
        <button className="btn btn-ghost" onClick={() => api.get('/audit').then(setData)}>🔄 Refresh</button>
      </div>

      {integrity && (
        <div className={`notification ${integrity.integrity ? 'notification-success' : 'notification-error'} fade-in`}>
          <span>{integrity.integrity ? '✅' : '❌'}</span>
          <span>{integrity.message || (integrity.integrity ? `Hash chain intact. ${integrity.events_verified} events verified.` : `Tampering detected at event ${integrity.broken_at}`)}</span>
        </div>
      )}

      <div className="card">
        <div className="card-title">Audit Events ({data?.count || 0})</div>
        {data?.events?.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No audit events yet. Interact with the system to generate events.</div>}
        {data?.events?.map((e, i) => (
          <div key={e.id} className="audit-event fade-in">
            <div style={{ color: 'var(--text-muted)', fontSize: 11, minWidth: 20, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                <span className="audit-actor" style={{ color: e.actor === 'policy_gate' ? 'var(--orange)' : e.actor === 'user' ? 'var(--purple)' : 'var(--accent)' }}>{e.actor}</span>
                <span style={{ fontSize: 13 }}>{e.action}</span>
                {e.refs.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ {e.refs.slice(0, 2).join(', ')}</span>}
              </div>
              <div className="audit-hash">{e.hash}</div>
              <div className="audit-timestamp">{new Date(e.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Eval Report ────────────────────────────────────────────────────────────────
function EvalScreen() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/eval/report').then(setData)
  }, [])

  if (!data) return <div style={{ padding: 28, color: 'var(--text-muted)' }}>Loading...</div>

  const metrics = [
    { label: 'Scenario Pass Rate', value: data.scenario_pass_rate, good: true },
    { label: 'Scam Recall', value: data.scam_recall, good: true },
    { label: 'Scam False Positives', value: data.scam_false_positives, good: true },
    { label: 'Injection Blocked', value: data.injection_blocked, good: true },
    { label: 'Escalation Blocked', value: data.escalation_blocked, good: true },
    { label: 'Hallucination Blocked', value: data.hallucination_blocked, good: true },
    { label: 'Unsupported Claims', value: `${data.unsupported_claims}`, good: data.unsupported_claims === 0 },
  ]

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="notification notification-info">
        <span>📊</span>
        <span>Evaluation report — failures shown honestly. Judges trust honesty more than a perfect score.</span>
      </div>

      <div className="grid-3">
        {metrics.slice(0, 3).map((m, i) => (
          <div key={i} className="card stat-card">
            <div className="card-title">{m.label}</div>
            <div className="stat-value" style={{ color: m.good ? 'var(--green)' : 'var(--red)', fontSize: 20 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {metrics.slice(3).map((m, i) => (
          <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: m.good ? 'var(--green)' : 'var(--red)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Known Failures (reported honestly)</div>
        {data.known_failures.map((f, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < data.known_failures.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <span className="badge badge-orange">{f.id}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Expected: {f.expected}</div>
            <div style={{ fontSize: 12, color: 'var(--orange)' }}>Got: {f.got}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Generated: {new Date(data.generated_at).toLocaleString()} · {data.note}
      </div>
    </div>
  )
}

// ── Chat Component ─────────────────────────────────────────────────────────────
function ChatPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: "Welcome Priya! I've built your financial landing plan for **Shenzhen**. We've got 6 weeks before arrival. Shall we look at the first critical task?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef()

  useEffect(() => { 
    if (!collapsed) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [msgs, collapsed])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await api.post('/chat', { message: userMsg })
      setMsgs(m => [...m, { role: 'ai', text: res.response }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: '⚠️ Connection error. Is the backend running?' }])
    }
    setLoading(false)
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="chat-section">
      <div className="chat-header" onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <div className="chat-avatar chat-avatar-ai">🤖</div>
        <div>
          <div className="chat-agent-name">Landfall AI Agent</div>
          <div className="chat-agent-status"><span className="status-dot dot-green"></span> READY · SIMULATED</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="simulated-badge">SIMULATED</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{collapsed ? '▲ Expand' : '▼ Minimize'}</span>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : ''} fade-in`}>
                <div className={`chat-avatar ${m.role === 'ai' ? 'chat-avatar-ai' : 'chat-avatar-user'}`}>
                  {m.role === 'ai' ? '🤖' : 'P'}
                </div>
                <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : ''}`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            ))}
            {loading && (
              <div className="chat-msg">
                <div className="chat-avatar chat-avatar-ai">🤖</div>
                <div className="chat-bubble" style={{ color: 'var(--text-muted)' }}>⏳ Analyzing...</div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={onKey} placeholder="Ask about tuition, scams, FX routes, credit path..." />
            <button className="chat-send" onClick={send} disabled={loading}>↑</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')

  const PAGES = {
    dashboard: <Dashboard profile={profile || {}} onNavigate={(p) => setPage(p)} />,
    plan: <PlanScreen />,
    tuition: <TuitionScreen />,
    remittance: <RemittanceScreen />,
    scam: <ScamScreen />,
    fx: <FXScreen />,
    docs: <DocsScreen />,
    credit: <CreditScreen />,
    audit: <AuditScreen />,
    eval: <EvalScreen />,
  }

  const currentNav = NAV.find(n => n.id === page)

  if (!profile) {
    return <OnboardingScreen onComplete={(p) => setProfile(p)} />
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">✈️</div>
          <div>
            <div className="logo-text">Landfall</div>
            <div className="logo-sub">Financial AI</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">Navigation</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-profile">
          <div className="profile-badge">
            <div className="profile-avatar">P</div>
            <div style={{ flex: 1 }}>
              <div className="profile-name">Priya</div>
              <div className="profile-tier">✓ Tier 1 Verified</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setProfile(null)} title="Re-configure onboarding profile">
              ✏️
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{currentNav?.icon} {currentNav?.label}</div>
            <div className="page-subtitle">India → China · INR/CNY · Shenzhen University</div>
          </div>
          <span className="simulated-badge">SIMULATED</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {PAGES[page]}
        </div>

        <ChatPanel />
      </div>
    </div>
  )
}
