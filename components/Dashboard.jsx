import React, { useState, useMemo, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertCircle, Calculator, Brain, Sparkles, AlertTriangle } from 'lucide-react'

// ----------------------- Utilities -----------------------
const americanToDecimal = (odds) => {
  if (odds > 0) return odds / 100 + 1
  if (odds < 0) return 100 / -odds + 1
  return 2.0
}

const americanToImplied = (odds) => {
  if (odds > 0) return (100 / (odds + 100)) * 100
  if (odds < 0) return ((-odds) / (-odds + 100)) * 100
  return 50
}

const decimalToImplied = (odds) => {
  if (odds <= 1.0) return 100
  return (1 / odds) * 100
}

const toNetOdds = (odds, type) => {
  let dec
  if (type === 'american') dec = americanToDecimal(odds)
  else dec = odds
  return dec - 1
}

const formatCurrency = (v) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  } catch (e) {
    return `$${Number(v).toFixed(2)}`
  }
}

// ----------------------- Shared UI -----------------------
const InputGroup = ({ label, id, value, onChange, type = 'text', unit, step = 'any', min, max, icon: Icon, description }) => (
  <div className="input-group">
    <label htmlFor={id}>{label}</label>
    <div className="input-row">
      {Icon && <Icon className="icon" />}
      <input id={id} type={type} step={step} min={min} max={max} value={value} onChange={onChange} />
      {unit && <span className="unit">{unit}</span>}
    </div>
    {description && <p className="desc">{description}</p>}
  </div>
)

const ResultDisplay = ({ label, value, unit, description, color = 'green', isNegative = false }) => (
  <div className="result">
    <div className="result-header">
      <span className="label">{label}</span>
      {unit && <span className="unit small">{unit}</span>}
    </div>
    <div className="result-value">
      <span className={isNegative ? 'neg' : color}>{value}</span>
    </div>
    {description && <p className="desc small">{description}</p>}
  </div>
)

// ----------------------- Dashboard (fixed) -----------------------
export default function Dashboard() {
  // store raw input strings so empty input isn't coerced to 0 automatically
  const [bankrollStr, setBankrollStr] = useState('1000')
  const [oddsStr, setOddsStr] = useState('200')
  const [oddsType, setOddsType] = useState('american')
  const [probStr, setProbStr] = useState('55')
  const [error, setError] = useState(null)

  const handleBankrollChange = (e) => setBankrollStr(e.target.value)
  const handleProbChange = (e) => setProbStr(e.target.value)
  const handleOddsChange = (e) => setOddsStr(e.target.value)
  const handleTypeChange = (e) => setOddsType(e.target.value)

  const results = useMemo(() => {
    // parse values safely
    const bankroll = parseFloat(bankrollStr)
    const winProbability = parseFloat(probStr)
    const oddsInput = parseFloat(oddsStr)

    // initialize return object
    const out = {
      error: null,
      f_star: 0,
      suggestedBet: 0,
      halfKellyBet: 0,
      impliedProb: null,
      netOdds: null,
      edge: null,
      isPositiveEV: false,
    }

    if (isNaN(winProbability) || winProbability < 0 || winProbability > 100) {
      out.error = 'Win probability must be between 0% and 100%.'
      return out
    }

    if (isNaN(bankroll) || bankroll <= 0) {
      out.error = 'Bankroll must be a positive number.'
      return out
    }

    if (isNaN(oddsInput)) {
      out.error = 'Odds must be a valid number.'
      return out
    }

    let bVal = 0
    let impliedProbVal = null

    if (oddsType === 'american') {
      bVal = toNetOdds(oddsInput, 'american')
      impliedProbVal = americanToImplied(oddsInput)
    } else {
      if (oddsInput <= 1.0) {
        out.error = 'Decimal odds must be greater than 1.0.'
        return out
      }
      bVal = toNetOdds(oddsInput, 'decimal')
      impliedProbVal = decimalToImplied(oddsInput)
    }

    if (bVal <= 0) {
      out.error = 'Net odds must be positive.'
      return out
    }

    const pVal = winProbability / 100
    const qVal = 1 - pVal

    const f_star_raw = (bVal * pVal - qVal) / bVal
    const f_star_clamped = Math.max(0, f_star_raw)
    const suggestedBetSize = bankroll * f_star_clamped

    out.f_star = f_star_clamped
    out.suggestedBet = suggestedBetSize
    out.halfKellyBet = suggestedBetSize / 2
    out.impliedProb = impliedProbVal
    out.netOdds = bVal
    out.edge = winProbability - (impliedProbVal || 0)
    out.isPositiveEV = out.edge > 0 && out.f_star > 0

    return out
  }, [bankrollStr, oddsStr, oddsType, probStr])

  // sync memo error to state (side-effect kept in effect)
  useEffect(() => {
    setError(results.error || null)
  }, [results.error])

  return (
    <div className="dashboard-root">
      <section className="panel">
        <div className="panel-header">
          <div className="icon-wrap"><Calculator /></div>
          <div>
            <h2>Kelly Criterion Calculator</h2>
            <p className="muted">Optimize your stake size based on edge.</p>
          </div>
        </div>

        <div className="two-col">
          <div>
            <InputGroup label="Total Bankroll" id="kelly-bankroll" value={bankrollStr} onChange={handleBankrollChange} type="number" icon={DollarSign} description="Your total available betting funds." />

            <div className="row two">
              <div className="select-wrap">
                <label>Odds Format</label>
                <select value={oddsType} onChange={handleTypeChange}>
                  <option value="american">American (+/-)</option>
                  <option value="decimal">Decimal</option>
                </select>
              </div>
              <InputGroup label="Odds" id="kelly-odds" value={oddsStr} onChange={handleOddsChange} type="number" step={oddsType === 'decimal' ? '0.01' : '1'} description={results.impliedProb ? `Implied: ${results.impliedProb.toFixed(1)}% | Net Odds (b): ${results.netOdds?.toFixed(2)}` : 'Enter odds to calculate implied probability.'} />
            </div>

            <InputGroup label="Your Win Probability (%)" id="kelly-prob" value={probStr} onChange={handleProbChange} unit="%" type="number" step="0.1" min="0" max="100" icon={TrendingUp} description="Your estimated chance of winning." />
          </div>

          <div className="panel-results">
            <h4>Analysis</h4>
            {error ? (
              <div className="alert error"><AlertCircle /> <span>{error}</span></div>
            ) : (
              <>
                <div className={`ev ${results.isPositiveEV ? 'positive' : 'negative'}`}>
                  <div>
                    <span>Expected Value (EV)</span>
                    <strong>{results.edge !== null ? `${results.edge > 0 ? '+' : ''}${results.edge.toFixed(2)}%` : '—'}</strong>
                  </div>
                  <p className="muted">Your estimated edge over the market.</p>
                </div>

                <div className="grid-2">
                  <ResultDisplay label="Full Kelly Bet" value={results.isPositiveEV ? formatCurrency(results.suggestedBet) : '$0.00'} description={results.isPositiveEV ? `${(results.f_star * 100).toFixed(2)}% of bankroll` : 'No positive EV found.'} isNegative={!results.isPositiveEV} />
                  <ResultDisplay label="Half Kelly Bet" value={results.isPositiveEV ? formatCurrency(results.halfKellyBet) : '$0.00'} description={results.isPositiveEV ? `${((results.f_star / 2) * 100).toFixed(2)}% of bankroll` : 'Conservative staking (recommended).'} color="yellow" isNegative={!results.isPositiveEV} />
                </div>

                {!results.isPositiveEV && (
                  <div className="alert warn"><AlertTriangle /> Warning: The expected value is negative. Kelly suggests a $0 bet.</div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="panel predictions">
        <div className="pred-header">
          <div className="icon-wrap"><Sparkles /></div>
          <div>
            <h3>AI Market Insights</h3>
            <p className="muted">Identifying market inefficiency.</p>
          </div>
        </div>

        <div className="pred-body">
          <div className="pred-card">
            <strong>Sample Prediction</strong>
            <p className="muted">This demo runs simulated market analysis based on bookmaker disagreement.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
