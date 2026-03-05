import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  ArrowDownCircle, ArrowUpCircle, Wallet, 
  RefreshCw 
} from 'lucide-react'

const CATEGORY_COLORS = {
  Food: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Transport: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Shopping: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Housing: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Investment: 'bg-green-500/10 text-green-400 border-green-500/20',
  Entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Income: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Utilities: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Health: 'bg-red-500/10 text-red-400 border-red-500/20',
  Education: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Others: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [txRes, summaryRes] = await Promise.all([
        axios.get('https://finzo-backend-1kdm.onrender.com/api/transactions?limit=500'),
        axios.get('https://finzo-backend-1kdm.onrender.com/api/transactions/summary')
      ])
      setTransactions(txRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.merchant.toLowerCase().includes(search.toLowerCase()) || 
        (tx.description && tx.description.toLowerCase().includes(search.toLowerCase()))
      
      const matchesCategory = categoryFilter ? tx.category === categoryFilter : true
      
      const matchesType = typeFilter === 'All' 
        ? true 
        : typeFilter === 'Debit' 
          ? tx.transaction_type === 'debit' 
          : tx.transaction_type === 'credit'

      return matchesSearch && matchesCategory && matchesType
    })
  }, [transactions, search, categoryFilter, typeFilter])

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, typeFilter])

  const categories = [...new Set(transactions.map(t => t.category))].sort()

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400">View and manage all your financial activity</p>
      </div>

      {/* 1. Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1d27] p-6 rounded-xl border border-[#2d3748]"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <ArrowDownCircle size={20} />
            </div>
            <span className="text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-full">Debits</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary?.total_debit?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total spending</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1d27] p-6 rounded-xl border border-[#2d3748]"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <ArrowUpCircle size={20} />
            </div>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full">Credits</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary?.total_credit?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total income</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1d27] p-6 rounded-xl border border-[#2d3748]"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Wallet size={20} />
            </div>
            <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded-full">Net</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary?.net_balance?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-400 mt-1">Current balance</div>
        </motion.div>
      </div>

      {/* 2. Search and Filter Bar */}
      <div className="bg-[#1a1d27] p-4 rounded-xl border border-[#2d3748] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search merchant or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0f1117] border border-[#2d3748] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#0f1117] border border-[#2d3748] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Debit">Debits Only</option>
            <option value="Credit">Credits Only</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-400">
          Showing <span className="text-white font-medium">{filteredTransactions.length}</span> results
        </div>
      </div>

      {/* 3. Transactions Table */}
      <div className="bg-[#1a1d27] rounded-xl border border-[#2d3748] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#11131a] text-xs uppercase text-gray-500 font-semibold border-b border-[#2d3748]">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3748]">
                {paginatedTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-[#2d3748]/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{tx.merchant}</span>
                        {tx.is_recurring && (
                          <div className="group relative">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              Recurring Payment
                            </div>
                          </div>
                        )}
                      </div>
                      {tx.description && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{tx.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Others}`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        tx.transaction_type === 'credit' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-medium ${
                      tx.transaction_type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-[#2d3748] flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-[#2d3748] text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="text-sm text-gray-400">
              Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-[#2d3748] text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
