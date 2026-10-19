import React, { useState } from 'react'

/**
 * FXSplineChart: Interactive SVG Area/Spline Chart for INR/CNY exchange rate
 */
export function FXSplineChart({ rates = [], scenario = 'baseline', currencyCode = 'INR', currencySymbol = '₹' }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  
  if (!rates || rates.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No FX data available</div>
  }

  const width = 640
  const height = 180
  const padLeft = 46
  const padRight = 20
  const padTop = 20
  const padBottom = 28

  const minRate = Math.min(...rates.map(r => r.rate)) * 0.995
  const maxRate = Math.max(...rates.map(r => r.rate)) * 1.005
  const range = maxRate - minRate || 0.001

  const getX = (i) => padLeft + (i / (rates.length - 1)) * (width - padLeft - padRight)
  const getY = (rate) => height - padBottom - ((rate - minRate) / range) * (height - padTop - padBottom)

  // Construct SVG spline path
  const points = rates.map((r, i) => [getX(i), getY(r.rate)])
  
  let dPath = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6

    dPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
  }

  const dArea = `${dPath} L ${points[points.length - 1][0]} ${height - padBottom} L ${points[0][0]} ${height - padBottom} Z`

  const activePoint = hoverIndex !== null ? rates[hoverIndex] : rates[rates.length - 1]
  const activeX = hoverIndex !== null ? getX(hoverIndex) : getX(rates.length - 1)
  const activeY = hoverIndex !== null ? getY(activePoint.rate) : getY(activePoint.rate)

  const isShock = scenario.includes('shock')
  const strokeColor = isShock ? 'var(--red)' : 'var(--accent)'
  const gradId = `fxGrad_${scenario}`

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Current Rate ({activePoint.date})
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: strokeColor, fontFamily: 'JetBrains Mono, monospace' }}>
            1 {currencyCode} = {activePoint.rate.toFixed(4)} CNY
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${isShock ? 'badge-red' : 'badge-green'}`} style={{ animation: 'pulseSubtle 2s infinite' }}>
            {isShock ? '⚠️ -8% Shock Replay' : '● Baseline Stability'}
          </span>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Vol: {isShock ? '±4.2%' : '±0.4%'} · Illustrated
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((pct, idx) => {
          const yVal = padTop + pct * (height - padTop - padBottom)
          const rateVal = (maxRate - pct * range).toFixed(4)
          return (
            <g key={idx}>
              <line x1={padLeft} y1={yVal} x2={width - padRight} y2={yVal} stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
              <text x={padLeft - 8} y={yVal + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="JetBrains Mono, monospace">
                {rateVal}
              </text>
            </g>
          )
        })}

        {/* Gradient fill */}
        <path d={dArea} fill={`url(#${gradId})`} />

        {/* Spline stroke */}
        <path d={dPath} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover interaction points */}
        {rates.map((r, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(r.rate)}
            r={i === hoverIndex ? 5 : 2}
            fill={i === hoverIndex ? '#fff' : strokeColor}
            stroke={strokeColor}
            strokeWidth={i === hoverIndex ? 2 : 1}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}

        {/* Active cursor indicator line */}
        <line
          x1={activeX}
          y1={padTop}
          x2={activeX}
          y2={height - padBottom}
          stroke={strokeColor}
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.8"
        />

        {/* Active Point Halo */}
        <circle cx={activeX} cy={activeY} r="6" fill={strokeColor} opacity="0.3" style={{ animation: 'pulseSubtle 1.5s infinite' }} />
        <circle cx={activeX} cy={activeY} r="3.5" fill="#fff" stroke={strokeColor} strokeWidth="2" />

        {/* X axis dates */}
        <text x={padLeft} y={height - 6} fill="var(--text-muted)" fontSize="9">
          {rates[0].date.slice(5)}
        </text>
        <text x={width / 2} y={height - 6} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
          {rates[Math.floor(rates.length / 2)].date.slice(5)}
        </text>
        <text x={width - padRight} y={height - 6} fill="var(--text-muted)" fontSize="9" textAnchor="end">
          {rates[rates.length - 1].date.slice(5)}
        </text>
      </svg>
    </div>
  )
}

/**
 * BudgetDonutChart: Multi-Currency Allocation Donut Chart
 */
export function BudgetDonutChart({ totalCNY = 50000 }) {
  const [hoveredSegment, setHoveredSegment] = useState(null)

  const items = [
    { label: 'Tuition (CNAPS)', amount: 28000, color: 'var(--accent)', icon: '🎓' },
    { label: 'Rent & Deposit', amount: 10000, color: 'var(--purple)', icon: '🏠' },
    { label: 'Living Expenses', amount: 7000, color: 'var(--green)', icon: '🍜' },
    { label: 'FX Reserve Buffer', amount: 5000, color: 'var(--yellow)', icon: '🛡' },
  ]

  const total = items.reduce((acc, item) => acc + item.amount, 0)
  const size = 160
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let currentOffset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          {items.map((item, idx) => {
            const pct = item.amount / total
            const strokeDasharray = `${pct * circumference} ${circumference}`
            const strokeDashoffset = -currentOffset
            currentOffset += pct * circumference
            const isHovered = hoveredSegment === idx

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  filter: isHovered ? `drop-shadow(0 0 8px ${item.color})` : 'none',
                }}
                onMouseEnter={() => setHoveredSegment(idx)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            )
          })}
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: size, height: size,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {hoveredSegment !== null ? items[hoveredSegment].label.split(' ')[0] : 'Total CNY'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: hoveredSegment !== null ? items[hoveredSegment].color : 'var(--text-primary)' }}>
            ¥{Number(hoveredSegment !== null ? items[hoveredSegment].amount : totalCNY).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, idx) => {
          const pct = Math.round((item.amount / total) * 100)
          const isHovered = hoveredSegment === idx
          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 8,
                background: isHovered ? 'var(--bg-card-hover)' : 'transparent',
                border: isHovered ? `1px solid ${item.color}` : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={() => setHoveredSegment(idx)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>¥{item.amount.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pct}%</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * RouteComparisonChart: Visual comparison of Landed Cost & Provider Spreads
 */
export function RouteComparisonChart({ quotes = [] }) {
  if (!quotes || quotes.length === 0) return null

  const getCost = q => (q.total_cost !== undefined ? q.total_cost : q.total_cost_inr)
  const sym = quotes[0]?.currency_symbol || '₹'
  const maxCost = Math.max(...quotes.map(getCost))
  const minCost = Math.min(...quotes.map(getCost))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {quotes.map((q, idx) => {
        const cost = getCost(q)
        const pct = maxCost > 0 ? (cost / maxCost) * 100 : 100
        const isBest = cost === minCost
        const diff = cost - minCost

        return (
          <div key={idx} className={`provider-bar-card ${isBest ? 'best' : ''}`} style={{
            padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: isBest ? '1px solid var(--green)' : '1px solid var(--border)',
            transition: 'all 0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{q.logo}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{q.provider_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed: {q.speed_days} · FX Spread: {q.fx_margin_pct}%</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: isBest ? 'var(--green)' : 'var(--text-primary)' }}>
                  {sym}{cost.toLocaleString()}
                </div>
                {isBest ? (
                  <span className="badge badge-green" style={{ fontSize: 9 }}>✓ LOWEST COST ROUTE</span>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--orange)' }}>+{sym}{Math.round(diff).toLocaleString()} higher</div>
                )}
              </div>
            </div>

            {/* Visual cost breakdown bar */}
            <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${pct * 0.94}%`, height: '100%', background: isBest ? 'var(--green)' : 'var(--accent)' }} title="Base Currency Cost" />
              <div style={{ width: `${pct * 0.04}%`, height: '100%', background: 'var(--orange)' }} title="FX Margin Spread" />
              <div style={{ width: `${pct * 0.02}%`, height: '100%', background: 'var(--purple)' }} title="Fixed & Network Fees" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * SAFEMeter: Annual $50,000 USD SAFE limit tracker gauge
 */
export function SAFEMeter({ currentCNY = 28000 }) {
  // Approximate CNY to USD at ~7.1
  const currentUSD = Math.round(currentCNY / 7.1)
  const maxUSD = 50000
  const pct = Math.min(100, Math.round((currentUSD / maxUSD) * 100))

  return (
    <div className="card card-green fade-in" style={{ padding: '16px 20px', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🛡</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>SAFE Inbound Regulatory Quota (Annual Limit)</span>
        </div>
        <span className="badge badge-green">✓ Within Annual Quota (Tier 1)</span>
      </div>

      <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--orange)' : 'linear-gradient(90deg, var(--accent), var(--green))',
          borderRadius: 4, transition: 'width 0.8s ease'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Used: <strong>${currentUSD.toLocaleString()} USD</strong> ({pct}%)</span>
        <span>Annual Cap: <strong>$50,000 USD</strong> equivalent</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
        Under SAFE regulations [RB-CN-SAFE-01], amounts under $50,000 USD/year don't require special foreign exchange approval.
      </div>
    </div>
  )
}

/**
 * CreditProgressGauge: Radial milestone meter for PBOC reference
 */
export function CreditProgressGauge({ completedSteps = 3, totalSteps = 6 }) {
  const pct = Math.round((completedSteps / totalSteps) * 100)
  const size = 110
  const stroke = 10
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (pct / 100) * circ

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: size, height: size,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{pct}%</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Readiness</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>PBOC Credit Reference Pathway</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {completedSteps} of {totalSteps} foundational milestones unlocked. Month 4 opens secured card application; Month 10 unlocks credit reference report inquiry.
        </div>
        <div style={{ marginTop: 6 }}>
          <span className="badge badge-accent">No Score Predictions · Sourced Milestones</span>
        </div>
      </div>
    </div>
  )
}
