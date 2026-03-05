import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, PiggyBank, Receipt,
  ArrowUpRight, ArrowDownRight, Lightbulb
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import GlassSurface from '../components/GlassSurface'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308']

const GLASS_PROPS = {
  displace: 1.1,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20,
  brightness: 53,
  opacity: 1,
  mixBlendMode: 'screen',
  borderRadius: 16,
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    summary: null,
    categories: [],
    trend: [],
    transactions: [],
    insight: null
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [summaryRes, categoriesRes, trendRes, txRes, insightsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/dashboard/summary'),
          axios.get('http://localhost:8000/api/dashboard/categories'),
          axios.get('http://localhost:8000/api/dashboard/monthly-trend'),
          axios.get('http://localhost:8000/api/transactions?limit=5'),
          axios.get('http://localhost:8000/api/insights')
        ])
        setData({
          summary: summaryRes.data,
          categories: categoriesRes.data,
          trend: trendRes.data,
          transactions: txRes.data,
          insight: insightsRes.data.insights?.[0] || null
        })
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <div className="text-red-400 p-4 bg-red-900/10 rounded-lg">{error}</div>

  const { summary, categories, trend, transactions, insight } = data

  const kpiCards = [
    {
      label: 'Total Spent',
      value: `₹${summary?.total_spent?.toLocaleString() || 0}`,
      icon: Wallet,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Total Income',
      value: `₹${summary?.total_income?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      trend: '+8%',
      trendUp: true
    },
    {
      label: 'Savings Rate',
      value: `${summary?.savings_rate || 0}%`,
      icon: PiggyBank,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      trend: '+2%',
      trendUp: true
    },
    {
      label: 'Transactions',
      value: summary?.transaction_count || 0,
      icon: Receipt,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      trend: '+5',
      trendUp: true
    }
  ]

  const glassCardStyle = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassSurface
              width="100%"
              height={130}
              {...GLASS_PROPS}
              style={{ width: '100%' }}
            >
              <div className="w-full h-full p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                    <card.icon size={18} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {card.trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {card.trend}
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-white mb-0.5">{card.value}</div>
                  <div className="text-xs text-gray-400">{card.label}</div>
                </div>
              </div>
            </GlassSurface>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spending Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={glassCardStyle}
          className="p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Spending Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,17,23,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                />
                <Line type="monotone" dataKey="total_amount" stroke="#6366f1" strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={glassCardStyle}
          className="p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Category Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="total_amount"
                  nameKey="category"
                >
                  {categories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,17,23,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={glassCardStyle}
          className="lg:col-span-2 overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-gray-500 font-semibold border-b border-white/5">
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">{tx.merchant}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${tx.transaction_type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* AI Insight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            ...glassCardStyle,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
          className="p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Lightbulb size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Insight</h3>
          </div>
          {insight ? (
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/20">
                {insight.insight_type}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                "{insight.insight_text || insight.headline}"
              </p>
              <div className="text-xs text-gray-500 pt-4 border-t border-indigo-500/20">
                Based on your last 30 days activity
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm italic">
              Generating insights based on your spending patterns...
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl bg-white/5" />
        <div className="h-80 rounded-xl bg-white/5" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-xl bg-white/5" />
        <div className="h-64 rounded-xl bg-white/5" />
      </div>
    </div>
  )
}