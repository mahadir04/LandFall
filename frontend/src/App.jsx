import { useState, useEffect, useRef } from 'react'
import './index.css'
import { FXSplineChart, BudgetDonutChart, RouteComparisonChart, SAFEMeter, CreditProgressGauge } from './components/Charts'
import { CURRENCIES, UNIVERSITIES } from './currencies'

const API = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '')

// ── API helpers ──────────────────────────────────────────────────────────────
const getAuthHeaders = () => {
  const token = localStorage.getItem('landfall_token')
  const email = localStorage.getItem('landfall_user_email')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (email) headers['X-User-Email'] = email
  return headers
}

const api = {
  get: (path) => fetch(`${API}${path}`, { headers: getAuthHeaders() }).then(async r => {
    const data = await r.json()
    if (!r.ok) throw new Error(data.detail || 'Request failed')
    return data
  }),
  post: (path, body) => fetch(`${API}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  }).then(async r => {
    const data = await r.json()
    if (!r.ok) throw new Error(data.detail || 'Request failed')
    return data
  }),
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
]

// ── Profile & Currency Switcher Modal ─────────────────────────────────────────
function ProfileModal({ profile, isOpen, onClose, onSave }) {
  if (!isOpen) return null

  const currentCur = CURRENCIES.find(c => c.code === (profile?.home_currency || 'INR')) || CURRENCIES[0]
  const [form, setForm] = useState({
    name: profile?.name || currentCur.defaultName,
    home_country: profile?.home_country || currentCur.country,
    home_city: profile?.home_city || currentCur.defaultCity,
    home_currency: profile?.home_currency || currentCur.code,
    home_currency_symbol: profile?.home_currency_symbol || currentCur.symbol,
    host_currency: 'CNY',
    host_country: 'CN',
    host_city: 'Shenzhen',
    host_university: profile?.host_university || UNIVERSITIES[0].name,
    arrival_date: profile?.arrival_date || '2026-12-01',
    program_end: profile?.program_end || '2028-06-30',
    monthly_budget_cny: profile?.monthly_budget_cny || 50000,
    funding_source: profile?.funding_source || currentCur.fundingOptions[0]
  })
  const [loading, setLoading] = useState(false)

  const handleCountrySelect = (code) => {
    const c = CURRENCIES.find(item => item.code === code) || CURRENCIES[0]
    setForm(f => ({
      ...f,
      home_country: c.country,
      home_city: c.defaultCity,
      home_currency: c.code,
      home_currency_symbol: c.symbol,
      funding_source: c.fundingOptions[0]
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/profile', form)
      onSave(res.profile, res.plan)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const selectedCur = CURRENCIES.find(c => c.code === form.home_currency) || CURRENCIES[0]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌍</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Select Origin & Currency</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Personalize Landfall for international students worldwide</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: 16, padding: '4px 8px' }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="input-group">
              <label className="input-label">Home Country & Currency</label>
              <select
                className="select"
                value={form.home_currency}
                onChange={e => handleCountrySelect(e.target.value)}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.country} — {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Student Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Home City</label>
                <input
                  className="input"
                  value={form.home_city}
                  onChange={e => setForm(f => ({ ...f, home_city: e.target.value }))}
                  placeholder="e.g. Mumbai, Kuala Lumpur"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Destination University (Shenzhen)</label>
              <select
                className="select"
                value={form.host_university}
                onChange={e => setForm(f => ({ ...f, host_university: e.target.value }))}
              >
                {UNIVERSITIES.map(u => (
                  <option key={u.code} value={u.name}>
                    🎓 {u.name} ({u.cn})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Funding Source</label>
              <select
                className="select"
                value={form.funding_source}
                onChange={e => setForm(f => ({ ...f, funding_source: e.target.value }))}
              >
                {selectedCur.fundingOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Self-Funded">Self-Funded</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">
                Initial Budget (CNY)
                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
                  ≈ {selectedCur.symbol}{Math.round(form.monthly_budget_cny * selectedCur.cnyToCurrency).toLocaleString()} {selectedCur.code}
                </span>
              </label>
              <input
                className="input"
                type="number"
                value={form.monthly_budget_cny}
                onChange={e => setForm(f => ({ ...f, monthly_budget_cny: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '✓ Apply Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Authentication & Onboarding Screen ──────────────────────────────────────
function AuthScreen({ onComplete }) {
  const [tab, setTab] = useState('signin') // 'signin' | 'register'
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Registration form
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0])
  const [regForm, setRegForm] = useState({
    email: '',
    password: '',
    name: '',
    home_country: CURRENCIES[0].country,
    home_city: '',
    home_currency: CURRENCIES[0].code,
    home_currency_symbol: CURRENCIES[0].symbol,
    host_currency: 'CNY',
    host_country: 'CN',
    host_city: 'Shenzhen',
    host_university: UNIVERSITIES[0].name,
    arrival_date: '2026-12-01',
    program_end: '2028-06-30',
    monthly_budget_cny: 50000,
    funding_source: CURRENCIES[0].fundingOptions[0]
  })

  const handleCountrySelect = (code) => {
    const c = CURRENCIES.find(item => item.code === code) || CURRENCIES[0]
    setSelectedCurrency(c)
    setRegForm(f => ({
      ...f,
      home_country: c.country,
      home_currency: c.code,
      home_currency_symbol: c.symbol,
      funding_source: c.fundingOptions[0]
    }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        email: loginEmail.trim(),
        password: loginPassword
      })
      if (res.status === 'ok') {
        localStorage.setItem('landfall_token', res.token)
        localStorage.setItem('landfall_user_email', res.user.email)
        onComplete(res.user, res.profile, res.plan)
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', regForm)
      if (res.status === 'ok') {
        localStorage.setItem('landfall_token', res.token)
        localStorage.setItem('landfall_user_email', res.user.email)
        onComplete(res.user, res.profile, res.plan)
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at top, #0d2035 0%, #0d1117 70%)', padding: '30px 16px' }}>
      <div className="onboarding-container fade-in" style={{ maxWidth: 540, width: '100%' }}>
        <div className="onboarding-logo" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="onboarding-logo-icon" style={{ margin: '0 auto 12px' }}>✈️</div>
          <div className="onboarding-title" style={{ fontSize: 26, fontWeight: 800 }}>Welcome to Landfall</div>
          <div className="onboarding-sub" style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            AI Financial Landing Assistant for International Students in China
          </div>
        </div>

        {error && (
          <div className="notification notification-error fade-in" style={{ marginBottom: 16 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="card" style={{ padding: 24 }}>
          {/* Navigation Tabs */}
          <div className="auth-nav-tabs">
            <button
              className={`auth-nav-tab ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => { setTab('signin'); setError('') }}
            >
              🔑 Sign In
            </button>
            <button
              className={`auth-nav-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError('') }}
            >
              👤 Create Student Account
            </button>
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label className="input-label">Student Email</label>
                <input
                  className="input"
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ padding: '12px 18px', fontSize: 15, marginTop: 10 }}>
                {loading ? 'Signing In...' : 'Sign In to My Profile & Plan →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Student Email</label>
                  <input
                    className="input"
                    type="email"
                    value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. alex@gmail.com"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Create Password</label>
                  <input
                    className="input"
                    type="password"
                    value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 4 characters"
                    minLength={4}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    className="input"
                    type="text"
                    value={regForm.name}
                    onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Student name"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Home City</label>
                  <input
                    className="input"
                    type="text"
                    value={regForm.home_city}
                    onChange={e => setRegForm(f => ({ ...f, home_city: e.target.value }))}
                    placeholder="Departure city"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Home Country & Currency</label>
                <select
                  className="select"
                  value={regForm.home_currency}
                  onChange={e => handleCountrySelect(e.target.value)}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.country} — {c.code} ({c.symbol}) · 1 CNY ≈ {c.cnyToCurrency} {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Destination University (Shenzhen)</label>
                <select
                  className="select"
                  value={regForm.host_university}
                  onChange={e => setRegForm(f => ({ ...f, host_university: e.target.value }))}
                >
                  {UNIVERSITIES.map(u => (
                    <option key={u.code} value={u.name}>
                      🎓 {u.name} ({u.cn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Arrival Date</label>
                  <input
                    className="input"
                    type="date"
                    value={regForm.arrival_date}
                    onChange={e => setRegForm(f => ({ ...f, arrival_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Program Ends</label>
                  <input
                    className="input"
                    type="date"
                    value={regForm.program_end}
                    onChange={e => setRegForm(f => ({ ...f, program_end: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Funding Rail</label>
                  <select
                    className="select"
                    value={regForm.funding_source}
                    onChange={e => setRegForm(f => ({ ...f, funding_source: e.target.value }))}
                  >
                    {selectedCurrency.fundingOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Self-Funded">Self-Funded</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">
                    Initial Budget (CNY)
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>
                      ≈ {selectedCurrency.symbol}{Math.round(regForm.monthly_budget_cny * selectedCurrency.cnyToCurrency).toLocaleString()}
                    </span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={regForm.monthly_budget_cny}
                    onChange={e => setRegForm(f => ({ ...f, monthly_budget_cny: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                type="submit"
                disabled={loading}
                style={{ marginTop: 12, padding: '14px 20px', fontSize: 16 }}
              >
                {loading ? 'Creating Profile & Generating Plan...' : '⚡ Create Profile & Generate My Landing Plan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ profile, plan, onNavigate }) {
  const [fxRates, setFxRates] = useState([])

  useEffect(() => {
    api.post('/fx/scenario', { scenario: 'baseline' }).then(res => {
      setFxRates(res?.rates || [])
    }).catch(() => {})
  }, [])

  const curInfo = CURRENCIES.find(c => c.code === profile?.home_currency) || CURRENCIES[0]
  const univName = profile?.host_university || 'Shenzhen University'
  const studentName = profile?.name || 'Student'
  const arrivalDate = profile?.arrival_date ? new Date(profile.arrival_date) : null
  const daysToArrival = arrivalDate && !isNaN(arrivalDate.getTime())
    ? Math.max(0, Math.ceil((arrivalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 42
  const displayMilestones = plan?.milestones?.slice(0, 4) || [
    { name: 'PSB Registration', status: 'pending', tag: '30-Day Window', critical: true },
    { name: 'Open Bank Account (ICBC)', status: 'pending', tag: 'Depends on PSB', critical: false },
    { name: `Tuition Remittance (${univName})`, status: 'pending', tag: 'Enrollment', critical: false },
    { name: 'UnionPay Debit Card Activation', status: 'pending', tag: 'Cashless Setup', critical: false },
  ]

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="notification notification-info fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>✈️</span>
          <span>
            Welcome <strong style={{ color: 'var(--text-primary)' }}>{studentName}</strong>! Landing plan active for <strong style={{ color: 'var(--accent)' }}>{univName}</strong> in Shenzhen.
          </span>
        </div>
        <span className="badge badge-accent">Host: China (CNY)</span>
      </div>

      <div className="grid-3">
        <div className="card stat-card floating-card">
          <div className="card-title">Allocated Budget</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>¥{Number(profile?.monthly_budget_cny || 50000).toLocaleString()}</div>
          <div className="stat-label">
            ≈ {curInfo.symbol}{Math.round((profile?.monthly_budget_cny || 50000) * curInfo.cnyToCurrency).toLocaleString()} {curInfo.code}
          </div>
        </div>
        <div className="card stat-card floating-card" style={{ animationDelay: '0.4s' }}>
          <div className="card-title">Days to Arrival</div>
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>{daysToArrival}</div>
          <div className="stat-label">Arrival: {profile?.arrival_date || 'Dec 1, 2026'}</div>
        </div>
        <div className="card stat-card floating-card" style={{ animationDelay: '0.8s' }}>
          <div className="card-title">{curInfo.code} / CNY Benchmark</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{curInfo.midRateToCNY}</div>
          <div className="stat-label">1 {curInfo.code} = {curInfo.midRateToCNY} CNY</div>
        </div>
      </div>

      {/* Graphical Insights: Donut Chart & Live Spline Chart */}
      <div className="grid-2">
        <div className="card fade-in">
          <div className="card-title">Multi-Currency Budget Allocation</div>
          <BudgetDonutChart totalCNY={profile?.monthly_budget_cny || 50000} />
        </div>

        <div className="card fade-in">
          <div className="card-title">{curInfo.code} / CNY Exchange Rate Trend (30 Days)</div>
          <FXSplineChart rates={fxRates.slice(-14)} scenario="baseline" />
        </div>
      </div>

      {/* SAFE Regulatory Compliance Gauge */}
      <SAFEMeter currentCNY={Number(profile?.monthly_budget_cny || 50000)} />

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Milestone Status (Critical Path)</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate && onNavigate('plan')} style={{ fontSize: 11, color: 'var(--accent)' }}>
              View All Milestones →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayMilestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`status-dot ${m.status === 'done' ? 'dot-green' : m.critical ? 'dot-red' : 'dot-orange'}`}></span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</span>
                </div>
                <span className={`badge ${m.status === 'done' ? 'badge-green' : m.critical ? 'badge-red' : 'badge-muted'}`}>
                  {m.status === 'done' ? '✓ DONE' : m.tag || 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Quick Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '📋', label: 'Critical Path & Checklists', page: 'plan', desc: 'Track and complete your 8 landing milestones' },
              { icon: '🎓', label: 'Verify Tuition Payee', page: 'tuition', desc: `Authenticate CNAPS account for ${univName}` },
              { icon: '💱', label: 'Compare Remittance Routes', page: 'remittance', desc: `Find lowest landed cost in ${curInfo.code}` },
              { icon: '🛡', label: 'Scam Shield Analyzer', page: 'scam', desc: 'Screen suspicious tuition discount offers' },
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
function PlanScreen({ profile, plan: initialPlan, onPlanUpdate }) {
  const [plan, setPlan] = useState(initialPlan)
  const [replanResult, setReplanResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    if (!initialPlan) {
      api.get('/plan').then(res => {
        setPlan(res)
        if (onPlanUpdate) onPlanUpdate(res)
      })
    } else {
      setPlan(initialPlan)
    }
  }, [initialPlan])

  const runReplan = async (scenario) => {
    setLoading(true)
    try {
      const res = await api.post('/plan/replan', { scenario })
      setReplanResult(res)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    setLoading(true)
    try {
      const res = await api.post('/plan/generate', {})
      if (res?.status === 'ok') {
        setPlan(res.plan)
        if (onPlanUpdate) onPlanUpdate(res.plan)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMilestone = async (milestoneId, newStatus) => {
    setTogglingId(milestoneId)
    try {
      const res = await api.post('/plan/milestone', {
        milestone_id: milestoneId,
        status: newStatus
      })
      if (res?.status === 'ok') {
        setPlan(res.plan)
        if (onPlanUpdate) onPlanUpdate(res.plan)
      }
    } finally {
      setTogglingId(null)
    }
  }

  const statusColor = { done: 'var(--green)', pending: 'var(--orange)', blocked: 'var(--red)', locked: 'var(--text-muted)' }
  const statusDot = { done: 'dot-green', pending: 'dot-orange', blocked: 'dot-red', locked: 'dot-muted' }

  const milestones = plan?.milestones || []
  const completedCount = milestones.filter(m => m.status === 'done').length
  const totalCount = milestones.length || 8
  const pct = Math.round((completedCount / (totalCount || 1)) * 100)

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Individual Plan Progress Card */}
      <div className="plan-progress-card fade-in">
        <div className="plan-progress-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋 Landing Plan for {profile?.name || plan?.user_name || 'Student'}</span>
              <span className="badge badge-accent">Individual Account Plan</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              🎓 {profile?.host_university || plan?.university || 'Shenzhen University'} · Arriving {profile?.arrival_date || '2026-12-01'} · Allocated Budget: ¥{Number(profile?.monthly_budget_cny || 50000).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: pct === 100 ? 'var(--green)' : 'var(--accent)' }}>
              {completedCount} of {totalCount} Done ({pct}%)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Interactive Critical Path</div>
          </div>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>Individual Milestones & Action Items</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click "Mark Done" to update and save progress to your individual profile</div>
          </div>
          <div>
            <button className="btn btn-primary btn-sm" onClick={handleRegenerate} disabled={loading} title="Regenerate plan tailored to current university and dates">
              {loading ? '⏳' : '⚡'} Regenerate Plan
            </button>
          </div>
        </div>

        {plan ? (
          <div className="milestone-list">
            {milestones.map((m, i) => (
              <div key={m.id} className="milestone-item fade-in">
                <div className="milestone-indicator">
                  <div className="milestone-dot-outer" style={{ background: m.status === 'done' ? 'var(--green-dim)' : 'var(--bg-secondary)', border: `2px solid ${statusColor[m.status] || 'var(--border)'}` }}>
                    <span className={`status-dot ${statusDot[m.status] || 'dot-muted'}`}></span>
                  </div>
                  {i < milestones.length - 1 && <div className="milestone-line"></div>}
                </div>
                <div className="milestone-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-muted" style={{ fontFamily: 'monospace', fontSize: 10 }}>{m.id}</span>
                    <span className="milestone-name" style={{ textDecoration: m.status === 'done' ? 'line-through' : 'none', opacity: m.status === 'done' ? 0.75 : 1 }}>
                      {m.name}
                    </span>
                  </div>
                  <div className="milestone-meta" style={{ marginTop: 4 }}>
                    <span>{m.duration_days} day{m.duration_days !== 1 ? 's' : ''}</span>
                    {m.slack_days === 0
                      ? <span className="milestone-critical">🔴 Critical path</span>
                      : <span className="milestone-slack">✓ {m.slack_days}d slack</span>
                    }
                    <span className="milestone-rule">{m.rule_ref}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{m.description}</div>
                </div>

                {/* Interactive Status & Action Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 120 }}>
                  <span className={`badge ${m.status === 'done' ? 'badge-green' : m.status === 'pending' ? 'badge-orange' : 'badge-muted'}`}>
                    {m.status.toUpperCase()}
                  </span>
                  <button
                    className={`milestone-toggle-btn ${m.status === 'done' ? 'done' : 'pending'}`}
                    onClick={() => handleToggleMilestone(m.id, m.status === 'done' ? 'pending' : 'done')}
                    disabled={togglingId === m.id}
                    title={m.status === 'done' ? 'Click to reopen milestone' : 'Mark milestone complete'}
                  >
                    {togglingId === m.id ? '⏳' : m.status === 'done' ? '✓ Done (Reopen)' : '○ Mark Done'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Loading plan for your profile...</div>}
      </div>
    </div>
  )
}

// ── Tuition & Payee ───────────────────────────────────────────────────────────
function TuitionScreen({ profile }) {
  const [institution, setInstitution] = useState(profile?.host_university || 'Shenzhen University')
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
          <div className="card-title">Tuition Direct Remittance — Official Confirmation</div>
          <div className="notification notification-info" style={{ marginBottom: 16 }}>
            <span>🔒</span>
            <span>Verified university recipient. Token is single-use with a 15-minute verification TTL.</span>
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
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Bound to official university account · Single-use · 15-min TTL</div>
              </div>
              <button className="btn btn-primary btn-full" onClick={pay}>⚡ Authorize Official Tuition Payment</button>
            </div>
          )}
        </div>
      )}

      {payResult && (
        <div className="card fade-in" style={{ border: '2px solid var(--green)' }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>Tuition Payment Verified & Scheduled</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              Transaction Ref: <code style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{payResult.transaction?.tx_id?.slice(0, 16)}...</code>
            </div>
            <div className="badge badge-green" style={{ marginTop: 12 }}>CNAPS DIRECT OFFICIAL TRANSFER · VERIFIED</div>
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
function RemittanceScreen({ profile }) {
  const [amount, setAmount] = useState(28000)
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const homeCur = profile?.home_currency || 'INR'
  const homeSym = profile?.home_currency_symbol || '₹'

  const compare = async (targetAmt = amount) => {
    setLoading(true)
    const res = await api.post('/quotes', {
      target_cny: Number(targetAmt),
      home_currency: homeCur
    })
    setQuotes(res.quotes || [])
    setLoading(false)
  }

  useEffect(() => {
    compare(amount)
  }, [profile?.home_currency])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="notification notification-info">
        <span>💱</span>
        <span>Routes compared by total landed cost ({homeCur}). Formula: total_cost = (target_cny / effective_rate) × (1 + fee%) + fixed_fee. [RB-CN-FX-01]</span>
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
            <div className="card-title">Route Efficiency & Cost Breakdown ({homeCur})</div>
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
                      <div className="provider-cost">{q.currency_symbol || homeSym}{(q.total_cost !== undefined ? q.total_cost : q.total_cost_inr).toLocaleString()}</div>
                      <div className="provider-cost-label">Total Landed Cost ({q.currency_code || homeCur})</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 12 }}>
                    <div><div style={{ color: 'var(--text-muted)' }}>FX Spread Margin</div><div style={{ fontWeight: 600 }}>{q.fx_margin_pct}%</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Platform Fee %</div><div style={{ fontWeight: 600 }}>{q.fee_pct}%</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Fixed Fee</div><div style={{ fontWeight: 600 }}>{q.currency_symbol || homeSym}{q.fixed_fee !== undefined ? q.fixed_fee : q.fixed_fee_inr}</div></div>
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
function FXScreen({ profile }) {
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
            <FXSplineChart rates={data.rates} scenario={scenario} currencyCode={profile?.home_currency || 'INR'} currencySymbol={profile?.home_currency_symbol || '₹'} />
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

// ── Chat Component ─────────────────────────────────────────────────────────────
function ChatPanel({ profile }) {
  const [collapsed, setCollapsed] = useState(false)
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: `Welcome ${profile?.name || 'Student'}! I've built your financial landing plan for **${profile?.host_university || 'Shenzhen'}**. We've got 6 weeks before arrival. Shall we look at the first critical task?` }
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
      const studentCtx = `Student: ${profile?.name || 'Student'} from ${profile?.home_city || 'Origin'}, ${profile?.home_country || 'Home'} (${profile?.home_currency || 'INR'} ${profile?.home_currency_symbol || '₹'}). Destination: ${profile?.host_university || 'Shenzhen University'} in Shenzhen, China.`
      const res = await api.post('/chat', { message: userMsg, context: studentCtx })
      setMsgs(m => [...m, { role: 'ai', text: res.response }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: '⚠️ Connection error. Is the backend running?' }])
    }
    setLoading(false)
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const avatarLetter = (profile?.name || 'S')[0].toUpperCase()

  return (
    <div className="chat-section">
      <div className="chat-header" onClick={() => setCollapsed(!collapsed)} style={{ cursor: 'pointer', userSelect: 'none' }}>
        <div className="chat-avatar chat-avatar-ai">🤖</div>
        <div>
          <div className="chat-agent-name">Landfall AI Assistant</div>
          <div className="chat-agent-status"><span className="status-dot dot-green"></span> ONLINE · 24/7 ASSISTANT</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{collapsed ? '▲ Expand' : '▼ Minimize'}</span>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : ''} fade-in`}>
                <div className={`chat-avatar ${m.role === 'ai' ? 'chat-avatar-ai' : 'chat-avatar-user'}`}>
                  {m.role === 'ai' ? '🤖' : avatarLetter}
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
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [plan, setPlan] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Try restoring existing login session on mount
  useEffect(() => {
    const token = localStorage.getItem('landfall_token')
    if (token) {
      api.get('/auth/me').then(res => {
        if (res?.status === 'ok') {
          setCurrentUser(res.user)
          setProfile(res.profile)
          setPlan(res.plan)
        }
      }).catch(() => {
        localStorage.removeItem('landfall_token')
        localStorage.removeItem('landfall_user_email')
      }).finally(() => {
        setAuthLoading(false)
      })
    } else {
      setAuthLoading(false)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('landfall_token')
    localStorage.removeItem('landfall_user_email')
    setCurrentUser(null)
    setProfile(null)
    setPlan(null)
  }

  const handleAuthComplete = (user, prof, pl) => {
    setCurrentUser(user)
    setProfile(prof)
    setPlan(pl)
  }

  const handleProfileSave = (updatedProf, updatedPlan) => {
    setProfile(updatedProf)
    if (updatedPlan) setPlan(updatedPlan)
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b11', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
          <div style={{ fontWeight: 600 }}>Loading Landfall Session...</div>
        </div>
      </div>
    )
  }

  if (!currentUser || !profile) {
    return <AuthScreen onComplete={handleAuthComplete} />
  }

  const PAGES = {
    dashboard: <Dashboard profile={profile} plan={plan} onNavigate={(p) => setPage(p)} />,
    plan: <PlanScreen profile={profile} plan={plan} onPlanUpdate={(p) => setPlan(p)} />,
    tuition: <TuitionScreen profile={profile} />,
    remittance: <RemittanceScreen profile={profile} />,
    scam: <ScamScreen />,
    fx: <FXScreen profile={profile} />,
    docs: <DocsScreen />,
    credit: <CreditScreen />,
  }

  const currentNav = NAV.find(n => n.id === page)
  const curInfo = CURRENCIES.find(c => c.code === profile.home_currency) || CURRENCIES[0]
  const avatarLetter = (profile.name || currentUser.name || 'S')[0].toUpperCase()

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
            <div className="profile-avatar">{avatarLetter}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.name || currentUser.name || 'Student'}
              </div>
              <div className="profile-tier" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {curInfo.flag} {currentUser.email}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 6px', fontSize: 13 }}
                onClick={() => setIsProfileModalOpen(true)}
                title="Edit profile & destination"
              >
                ⚙️
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 6px', fontSize: 13, color: 'var(--orange)' }}
                onClick={handleLogout}
                title="Switch account / Sign out"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{currentNav?.icon} {currentNav?.label}</div>
            <div className="page-subtitle">
              {curInfo.flag} {profile.home_city || 'Origin'}, {profile.home_country || 'Home'} ({profile.home_currency || 'INR'} {profile.home_currency_symbol || curInfo.symbol}) ➔ 🇨🇳 Shenzhen, China ({profile.host_university || 'Shenzhen University'})
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsProfileModalOpen(true)}
              style={{
                borderRadius: 20, padding: '6px 14px', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1px solid var(--border-accent)',
                background: 'var(--accent-dim)',
                color: 'var(--text-primary)'
              }}
              title="Change home location, origin country, or currency"
            >
              <span>{curInfo.flag}</span>
              <span style={{ fontWeight: 700 }}>{profile.home_currency} ({profile.home_currency_symbol || curInfo.symbol})</span>
              <span style={{ fontSize: 10, color: 'var(--accent)' }}>▾ Switch Origin</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{
                borderRadius: 20, padding: '6px 12px', fontSize: 11,
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}
              title={`Logged in as ${currentUser.email}. Click to sign out.`}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {PAGES[page]}
        </div>

        <ChatPanel profile={profile} />

        <ProfileModal
          profile={profile}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleProfileSave}
        />
      </div>
    </div>
  )
}
