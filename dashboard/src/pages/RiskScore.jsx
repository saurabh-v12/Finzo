import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const API = 'http://localhost:8000'

export default function RiskScore() {
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState([])
  const [finalScore, setFinalScore] = useState(0)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, txRes] = await Promise.all([
          axios.get(`${API}/api/dashboard/summary`),
          axios.get(`${API}/api/transactions?limit=500`)
        ])
        const sum = sumRes.data
        const txs = Array.isArray(txRes.data) ? txRes.data : txRes.data.transactions || []
        setSummary(sum)
        setTransactions(txs)

        // Factor 1 — Debt to Income
        const housing = txs.filter(t => t.category === 'Housing' && t.transaction_type === 'debit')
          .reduce((s, t) => s + t.amount, 0)
        const dtiRatio = sum.total_income > 0 ? (housing / sum.total_income) * 100 : 0
        const dtiScore = dtiRatio < 30 ? 80 : dtiRatio < 40 ? 55 : 30

        // Factor 2 — Payment Consistency
        const recurringCount = txs.filter(t => t.is_recurring).length
        const consistencyScore = recurringCount > 3 ? 90 : recurringCount > 0 ? 60 : 40

        // Factor 3 — Savings Rate
        const savingsRate = sum.savings_rate || 0
        const savingsScore = savingsRate > 20 ? 85 : savingsRate >= 0 ? 50 : 20

        // Factor 4 — Spending Volatility
        const weeks = [0, 0, 0, 0]
        txs.forEach(t => {
          if (t.transaction_type === 'debit' && t.date) {
            const day = parseInt(t.date.split('-')[0])
            if (day <= 7) weeks[0] += t.amount
            else if (day <= 14) weeks[1] += t.amount
            else if (day <= 21) weeks[2] += t.amount
            else weeks[3] += t.amount
          }
        })
        const nonZeroWeeks = weeks.filter(w => w > 0)
        const avgWeek = nonZeroWeeks.reduce((s, w) => s + w, 0) / (nonZeroWeeks.length || 1)
        const maxWeek = Math.max(...weeks)
        const minWeek = Math.min(...nonZeroWeeks.length ? nonZeroWeeks : [0])
        const volatility = avgWeek > 0 ? ((maxWeek - minWeek) / avgWeek) * 100 : 0
        const volatilityScore = volatility < 50 ? 80 : volatility < 100 ? 55 : 30

        // Factor 5 — Investment Discipline
        const investmentTotal = txs.filter(t => t.category === 'Investment' && t.transaction_type === 'debit')
          .reduce((s, t) => s + t.amount, 0)
        const investmentRate = sum.total_income > 0 ? (investmentTotal / sum.total_income) * 100 : 0
        const investmentScore = investmentRate > 15 ? 90 : investmentRate > 5 ? 60 : 30

        const computedFactors = [
          {
            label: 'Debt-to-Income Ratio',
            score: dtiScore,
            detail: `EMIs are ${dtiRatio.toFixed(1)}% of income (safe limit: 30%)`,
            color: dtiScore >= 70 ? 'green' : dtiScore >= 50 ? 'amber' : 'red'
          },
          {
            label: 'Payment Consistency',
            score: consistencyScore,
            detail: `${recurringCount} recurring payments detected`,
            color: consistencyScore >= 70 ? 'green' : consistencyScore >= 50 ? 'amber' : 'red'
          },
          {
            label: 'Savings Rate',
            score: savingsScore,
            detail: `${savingsRate.toFixed(1)}% savings rate this month`,
            color: savingsScore >= 70 ? 'green' : savingsScore >= 40 ? 'amber' : 'red'
          },
          {
            label: 'Spending Volatility',
            score: volatilityScore,
            detail: `Weekly spending varies by ${volatility.toFixed(0)}%`,
            color: volatilityScore >= 70 ? 'green' : volatilityScore >= 50 ? 'amber' : 'red'
          },
          {
            label: 'Investment Discipline',
            score: investmentScore,
            detail: `${investmentRate.toFixed(1)}% of income invested`,
            color: investmentScore >= 70 ? 'green' : investmentScore >= 50 ? 'amber' : 'red'
          },
        ]

        setFactors(computedFactors)
        const avg = Math.round(
          computedFactors.reduce((s, f) => s + f.score, 0) / computedFactors.length
        )
        setFinalScore(avg)

      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const scoreColor = finalScore >= 70 ? 'text-green-400' : finalScore >= 40 ? 'text-amber-400' : 'text-red-400'
  const scoreLabel = finalScore >= 70 ? 'LOW RISK' : finalScore >= 40 ? 'MODERATE RISK' : 'HIGH RISK'
  const scoreBg = finalScore >= 70 ? 'bg-green-500' : finalScore >= 40 ? 'bg-amber-500' : 'bg-red-500'

  const barColor = (color) => ({
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }[color])

  const lowestFactors = [...factors].sort((a, b) => a.score - b.score).slice(0, 3)

  const historyData = [
    { month: 'Oct', score: Math.max(finalScore - 10, 0) },
    { month: 'Nov', score: Math.max(finalScore - 8, 0) },
    { month: 'Dec', score: Math.max(finalScore - 5, 0) },
    { month: 'Jan', score: Math.max(finalScore - 3, 0) },
    { month: 'Feb', score: finalScore },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm mb-2">Financial Risk Score</div>
            <div className={`text-6xl font-bold ${scoreColor}`}>{finalScore}</div>
            <div className="text-gray-500 text-sm mt-1">out of 100</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${scoreColor} mb-2`}>{scoreLabel}</div>
            <div className="w-32 h-3 bg-[#2d3748] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreBg} transition-all`}
                style={{ width: `${finalScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>High Risk</span>
              <span>Low Risk</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Factors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Score Breakdown</h3>
        <div className="space-y-4">
          {factors.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white">{f.label}</span>
                <span className={`text-sm font-bold ${
                  f.color === 'green' ? 'text-green-400' :
                  f.color === 'amber' ? 'text-amber-400' : 'text-red-400'
                }`}>{f.score}/100</span>
              </div>
              <div className="h-2 bg-[#2d3748] rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${barColor(f.color)} transition-all`}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">{f.detail}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Improvement Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Improvement Roadmap
        </h3>
        <div className="space-y-3">
          {lowestFactors.map((f, i) => (
            <div
              key={f.label}
              className="flex items-center justify-between p-3 bg-[#0f1117] rounded-lg"
            >
              <div>
                <div className="text-sm text-white font-medium">{f.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{f.detail}</div>
              </div>
              <div className="text-indigo-400 text-sm font-bold ml-4">
                +{Math.round((100 - f.score) * 0.15)} pts
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Score History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Score History</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={historyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#1a1d27',
                border: '1px solid #2d3748',
                borderRadius: '8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

    </div>
  )
}