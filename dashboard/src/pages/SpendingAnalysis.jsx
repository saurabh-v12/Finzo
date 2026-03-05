import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const API = 'https://finzo-backend-1kdm.onrender.com'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16']

export default function SpendingAnalysis() {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState([])
  const [topMerchants, setTopMerchants] = useState([])
  const [highestDay, setHighestDay] = useState({ amount: 0, date: '' })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, catRes, txRes] = await Promise.all([
          axios.get(`${API}/api/dashboard/summary`),
          axios.get(`${API}/api/dashboard/categories`),
          axios.get(`${API}/api/transactions?limit=500`)
        ])
        setSummary(sumRes.data)
        setCategories(catRes.data)
        const txs = Array.isArray(txRes.data) ? txRes.data : txRes.data.transactions || []
        setTransactions(txs)

        // Weekly totals
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
        setWeeklyData([
          { week: 'Week 1', amount: Math.round(weeks[0]) },
          { week: 'Week 2', amount: Math.round(weeks[1]) },
          { week: 'Week 3', amount: Math.round(weeks[2]) },
          { week: 'Week 4', amount: Math.round(weeks[3]) },
        ])

        // Top merchants
        const merchantMap = {}
        txs.forEach(t => {
          if (t.transaction_type === 'debit' && t.merchant) {
            merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + t.amount
          }
        })
        const sorted = Object.entries(merchantMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([merchant, amount]) => ({ merchant, amount: Math.round(amount) }))
        setTopMerchants(sorted)

        // Highest single day
        const dailyMap = {}
        txs.forEach(t => {
          if (t.transaction_type === 'debit' && t.date) {
            dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount
          }
        })
        const maxDay = Object.entries(dailyMap).sort((a, b) => b[1] - a[1])[0]
        if (maxDay) setHighestDay({ date: maxDay[0], amount: Math.round(maxDay[1]) })

      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const avgDaily = summary ? Math.round(summary.total_spent / 28) : 0
  const maxMerchantAmount = topMerchants[0]?.amount || 1

  return (
    <div className="space-y-6">

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Spent', value: `₹${(summary?.total_spent || 0).toLocaleString('en-IN')}`, color: 'text-red-400' },
          { label: 'Avg Daily Spend', value: `₹${avgDaily.toLocaleString('en-IN')}`, color: 'text-amber-400' },
          { label: 'Highest Single Day', value: `₹${highestDay.amount.toLocaleString('en-IN')}`, sub: highestDay.date, color: 'text-purple-400' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
          >
            <div className="text-gray-400 text-sm mb-2">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            {card.sub && <div className="text-xs text-gray-500 mt-1">{card.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">

        {/* Category Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="total_amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                contentStyle={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Weekly Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                contentStyle={{ background: '#1a1d27', border: '1px solid #2d3748', borderRadius: '8px' }}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Merchants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Merchants This Month</h3>
        <div className="space-y-3">
          {topMerchants.map((m, i) => (
            <div key={m.merchant} className="flex items-center gap-4">
              <div className="w-6 text-xs text-gray-500">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white truncate">{m.merchant}</span>
                  <span className="text-sm text-gray-400 ml-2">₹{m.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-1.5 bg-[#2d3748] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(m.amount / maxMerchantAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
