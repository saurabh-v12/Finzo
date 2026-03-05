import Silk from './Silk'
import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, FileText, List, PieChart, 
  Wallet, Lightbulb, 
  Shield, LogOut, User, Settings, Info
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/transactions', icon: List, label: 'Transactions' },
  { path: '/analysis', icon: PieChart, label: 'Spending Analysis' },
  { path: '/budget', icon: Wallet, label: 'Budget' },
  { path: '/insights', icon: Lightbulb, label: 'AI Insights' },
  { path: '/risk', icon: Shield, label: 'Risk Score' },
]

export default function Layout() {
  const location = useLocation()
  const currentPage = navItems.find(n => 
    n.path === location.pathname
  )?.label || 'Dashboard'

  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState(null)

  const userEmail = localStorage.getItem('finzo_user') || 'user@email.com'
  const userName = userEmail.split('@')[0]
  const userInitial = userName[0].toUpperCase()

  const handleLogout = () => {
    localStorage.removeItem('finzo_user')
    window.location.href = 'http://localhost:5173/login'
  }

  return (
    <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden relative">

      {/* Silk Background */}
      <Silk color="#1e1b4b" speed={0.4} scale={1.8} noiseIntensity={0.4} rotation={10} />

      {/* Dark overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'rgba(96, 96, 96, 0.25)',
      }}/>

      {/* Vignette overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
      }}/>

      {/* Sidebar */}
      <div className="w-64 flex flex-col shrink-0 relative z-10"
        style={{
          background: 'rgba(15,17,23,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wallet size={16} />
            </div>
            <span className="text-xl font-bold">Finzo</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              end={item.path === '/'} 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg 
                 text-sm font-medium transition-all duration-200 
                 ${isActive 
                   ? 'bg-indigo-600 text-white' 
                   : 'text-gray-400 hover:bg-white/5 hover:text-white'
                 }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer — Avatar */}
        <div className="p-4 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div 
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
            onClick={() => { setMenuOpen(!menuOpen); setView(null) }}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-xs text-gray-500">Premium</div>
            </div>
          </div>

          {/* Dropdown */}
          {menuOpen && view === null && (
            <div className="absolute bottom-20 left-4 right-4 rounded-xl p-2 shadow-2xl z-50"
              style={{
                background: 'rgba(10,12,18,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="px-3 py-2 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-sm font-semibold text-white">{userName}</div>
                <div className="text-xs text-gray-500">{userEmail}</div>
              </div>

              {[
                { label: 'Profile', icon: User, view: 'profile' },
                { label: 'Settings', icon: Settings, view: 'settings' },
                { label: 'About', icon: Info, view: 'about' },
              ].map(item => (
                <div
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer transition-all"
                >
                  <item.icon size={15} />
                  {item.label}
                </div>
              ))}

              <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                >
                  <LogOut size={15} />
                  Logout
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0"
          style={{
            background: 'rgba(15,17,23,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h1 className="text-lg font-semibold">{currentPage}</h1>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            Live
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div 
            key={location.pathname} 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Profile Modal */}
      {view === 'profile' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999]">
          <div className="rounded-2xl p-8 w-96" style={{ background: 'rgba(20,24,36,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-white text-xl font-bold mb-6">Profile</h2>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto">
                {userInitial}
              </div>
            </div>
            {[
              { label: 'Username', value: userName },
              { label: 'Email', value: userEmail },
              { label: 'Plan', value: 'Premium' },
              { label: 'App Version', value: '1.0.0' },
            ].map(field => (
              <div key={field.label} className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">{field.label}</div>
                <div className="text-sm text-white">{field.value}</div>
              </div>
            ))}
            <button onClick={() => { setView(null); setMenuOpen(false) }}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg mt-2 hover:bg-indigo-700 transition-all">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {view === 'settings' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999]">
          <div className="rounded-2xl p-8 w-96" style={{ background: 'rgba(20,24,36,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-white text-xl font-bold mb-6">Settings</h2>
            {[
              { label: 'Notifications', desc: 'Alerts for upcoming payments' },
              { label: 'Dark Mode', desc: 'App uses dark theme by default' },
              { label: 'Auto-generate Insights', desc: 'Generate after each upload' },
              { label: 'Currency', desc: 'Indian Rupee (₹ INR)' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-3">
                <div>
                  <div className="text-sm text-white font-medium">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
                <div className="w-10 h-5 bg-indigo-600 rounded-full cursor-pointer"/>
              </div>
            ))}
            <button onClick={() => { setView(null); setMenuOpen(false) }}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg mt-2 hover:bg-indigo-700 transition-all">
              Close
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {view === 'about' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999]">
          <div className="rounded-2xl p-8 w-96 text-center" style={{ background: 'rgba(20,24,36,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-white text-2xl font-bold mb-2">Finzo</h2>
            <p className="text-gray-400 text-sm mb-6">Version 1.0.0 · NAVONMESH 2026</p>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              AI-powered personal finance tracker. Upload your bank statement and get instant insights powered by Google Gemini.
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              {[
                { label: 'Built by', value: 'Saurabh Vishwakarma' },
                { label: 'AI', value: 'Google Gemini 2.0 Flash' },
                { label: 'Auth', value: 'Clerk' },
                { label: 'Backend', value: 'FastAPI + SQLite' },
              ].map(item => (
                <div key={item.label} className="flex justify-between mb-2">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className="text-white text-sm">{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setView(null); setMenuOpen(false) }}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}