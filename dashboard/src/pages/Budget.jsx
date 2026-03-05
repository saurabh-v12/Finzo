import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const API = 'https://finzo-backend-1kdm.onrender.com'

const DEFAULT_BUDGETS = {
  Food: 6000,
  Transport: 5000,
  Shopping: 5000,
  Housing: 12000,
  Health: 3000,
  Entertainment: 3000,
  Investment: 15000,
  Education: 3000,
  Utilities: 3000,
  Others: 30000,
  Income: 0,
}

const CATEGORY_EMOJI = {
  Food: '🍕', Transport: '🚗', Shopping: '🛍️',
  Housing: '🏠', Health: '💊', Entertainment: '🎬',
  Investment: '📈', Education: '📚', Utilities: '⚡',
  Others: '📦', Income: '💰',
}

export default function Budget() {
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('finzo_budgets')
    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS
  })
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/dashboard/categories`)
      .then(r => setCategories(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const saveEdit = (category) => {
    const newBudgets = { ...budgets, [category]: parseInt(editValue) || 0 }
    setBudgets(newBudgets)
    localStorage.setItem('finzo_budgets', JSON.stringify(newBudgets))
    setEditing(null)
  }

  const totalBudgeted = categories.reduce((s, c) => s + (budgets[c.category] || 0), 0)
  const totalSpent = categories.reduce((s, c) => s + c.total_amount, 0)
  const onTrack = categories.filter(c => c.total_amount <= (budgets[c.category] || 0) * 0.8).length
  const overBudget = categories.filter(c => c.total_amount > (budgets[c.category] || 0)).length
  const healthScore = categories.length > 0 ? Math.round((onTrack / categories.length) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm mb-1">Budget Health Score</div>
            <div className={`text-4xl font-bold ${
              healthScore >= 70 ? 'text-green-400' :
              healthScore >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>{healthScore}%</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{onTrack}</div>
              <div className="text-xs text-gray-400">On Track</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{overBudget}</div>
              <div className="text-xs text-gray-400">Over Budget</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-400">
                ₹{Math.max(0, totalBudgeted - totalSpent).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-400">Remaining</div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Total Spent: ₹{Math.round(totalSpent).toLocaleString('en-IN')}</span>
            <span>Budgeted: ₹{totalBudgeted.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-2 bg-[#2d3748] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalSpent > totalBudgeted ? 'bg-red-500' :
                totalSpent > totalBudgeted * 0.8 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 gap-4">
        {categories.filter(c => c.category !== 'Income').map((cat, i) => {
          const budget = budgets[cat.category] || 0
          const spent = cat.total_amount
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
          const over = spent > budget
          const nearLimit = !over && pct >= 80

          return (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#1a1d27] border border-[#2d3748] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_EMOJI[cat.category] || '📌'}</span>
                  <span className="text-sm font-medium text-white">{cat.category}</span>
                </div>
                <button
                  onClick={() => { setEditing(cat.category); setEditValue(budget) }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-all"
                >
                  ✏️ Edit
                </button>
              </div>

              {editing === cat.category ? (
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                    placeholder="Budget amount"
                  />
                  <button
                    onClick={() => saveEdit(cat.category)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>₹{Math.round(spent).toLocaleString('en-IN')} spent</span>
                  <span>₹{budget.toLocaleString('en-IN')} budget</span>
                </div>
              )}

              <div className="h-2 bg-[#2d3748] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    over ? 'bg-red-500' : nearLimit ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 text-xs">
                {over ? (
                  <span className="text-red-400">⚠️ Over by ₹{Math.round(spent - budget).toLocaleString('en-IN')}</span>
                ) : (
                  <span className="text-gray-500">₹{Math.round(budget - spent).toLocaleString('en-IN')} remaining</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
