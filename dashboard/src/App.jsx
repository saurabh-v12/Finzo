import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Transactions from './pages/Transactions'
import SpendingAnalysis from './pages/SpendingAnalysis'
import Budget from './pages/Budget'
import AIInsights from './pages/AIInsights'
import RiskScore from './pages/RiskScore'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="analysis" element={<SpendingAnalysis />} />
          <Route path="budget" element={<Budget />} />
          <Route path="insights" element={<AIInsights />} />
          <Route path="risk" element={<RiskScore />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}