import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Sparkles, RefreshCw } from 'lucide-react'

const API = 'http://localhost:8000'

const TYPE_STYLES = {
  OVERSPENDING: { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500', text: 'text-red-400' },
  HIDDEN_COST: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', badge: 'bg-purple-500', text: 'text-purple-400' },
  PATTERN: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500', text: 'text-blue-400' },
  OPPORTUNITY: { bg: 'bg-green-500/10', border: 'border-green-500/30', badge: 'bg-green-500', text: 'text-green-400' },
  RISK: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500', text: 'text-amber-400' },
  POSITIVE: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', badge: 'bg-teal-500', text: 'text-teal-400' },
}

export default function AIInsights() {
  const [insights, setInsights] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [cached, setCached] = useState(false)

  const fetchInsights = async () => {
    try {
      const [insRes, sumRes] = await Promise.all([
        axios.get(`${API}/api/insights`),
        axios.get(`${API}/api/dashboard/summary`)
      ])
      const data = insRes.data
      setInsights(data.insights || data || [])
      setCached(data.cached || false)
      setSummary(sumRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInsights() }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await axios.post(`${API}/api/insights/generate`)
      await fetchInsights()
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">
            Behavioral analysis powered by Gemini AI
            {cached && <span className="ml-2 text-xs text-indigo-400">· Cached</span>}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg transition-all"
        >
          {generating
            ? <><RefreshCw size={15} className="animate-spin"/> Analyzing...</>
            : <><Sparkles size={15}/> Run Full Analysis</>
          }
        </button>
      </div>

      {/* Monthly Summary Card */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1d27] border border-indigo-500/30 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-indigo-400"/>
            <span className="text-sm font-semibold text-indigo-400">Monthly Summary</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            This month you spent{' '}
            <span className="text-white font-semibold">
              ₹{summary.total_spent?.toLocaleString('en-IN')}
            </span>{' '}
            across{' '}
            <span className="text-white font-semibold">
              {summary.transaction_count} transactions
            </span>{' '}
            with a savings rate of{' '}
            <span className={`font-semibold ${summary.savings_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.savings_rate?.toFixed(1)}%
            </span>.
          </p>
        </motion.div>
      )}

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🤖</div>
          <div className="text-gray-400 text-sm mb-4">
            No insights yet. Click Run Full Analysis to generate insights.
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-all"
          >
            {generating ? 'Analyzing...' : 'Generate Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {insights.map((insight, i) => {
            const style = TYPE_STYLES[insight.insight_type] || TYPE_STYLES.PATTERN
            return (
              <motion.div
                key={insight.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`${style.bg} border ${style.border} rounded-xl p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${style.badge}`}>
                    {insight.insight_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {insight.generated_at
                      ? new Date(insight.generated_at).toLocaleDateString('en-IN')
                      : ''}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-sm mb-2 leading-snug">
                  {insight.headline}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-3">
                  {insight.body_text}
                </p>
                {insight.action_text && (
                  <div className={`text-xs font-medium ${style.text} flex items-start gap-1`}>
                    <span>→</span>
                    <span>{insight.action_text}</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}