import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud, FileText, CheckCircle2,
  Trash2, AlertCircle, Loader2
} from 'lucide-react'

const DOC_TYPES = [
  { id: 'bank_statement', label: 'Bank Statement' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'upi_export', label: 'UPI History' },
  { id: 'invoice', label: 'Invoice/Bill' },
  { id: 'loan_document', label: 'Loan Document' },
  { id: 'tax_record', label: 'Tax Record' },
  { id: 'salary_slip', label: 'Salary Slip' },
]

const PROCESSING_STEPS = [
  'File received',
  'Extracting text',
  'Sending to AI',
  'Structuring transactions',
  'Categorizing',
  'Done'
]

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('bank_statement')
  const [uploading, setUploading] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/upload/documents')
      setDocuments(res.data)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', selectedType)

    setUploading(true)
    setProcessingStep(0)
    setUploadSuccess(false)

    // Simulate processing steps animation
    const stepInterval = setInterval(() => {
      setProcessingStep(prev => {
        if (prev >= PROCESSING_STEPS.length - 1) {
          clearInterval(stepInterval)
          return prev
        }
        return prev + 1
      })
    }, 1500)

    try {
      await axios.post('http://localhost:8000/api/upload/document', formData)
      
      // Ensure animation completes
      setTimeout(() => {
        clearInterval(stepInterval)
        setProcessingStep(PROCESSING_STEPS.length - 1)
        setUploadSuccess(true)
        setUploading(false)
        fetchDocuments()
        
        // Reset after success message
        setTimeout(() => {
          setUploadSuccess(false)
          setProcessingStep(0)
        }, 3000)
      }, PROCESSING_STEPS.length * 1500)

    } catch (err) {
      console.error('Upload failed:', err)
      clearInterval(stepInterval)
      setUploading(false)
      alert('Upload failed. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await axios.delete(`http://localhost:8000/api/upload/documents/${id}`)
      setDocuments(prev => prev.filter(doc => doc.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete document')
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="text-gray-400">Manage your financial files and invoices</p>
      </div>

      {/* 1. Document Type Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400">Document Type</label>
        <div className="flex flex-wrap gap-3">
          {DOC_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                selectedType === type.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-[#1a1d27] border-[#2d3748] text-gray-400 hover:border-indigo-500/50 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Upload Zone & 3. Processing Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          layout
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            uploading 
              ? 'border-indigo-500/50 bg-indigo-500/5 cursor-default' 
              : 'border-[#2d3748] hover:border-indigo-500 hover:bg-[#1a1d27]'
          }`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.csv"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-xs space-y-4"
              >
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                </div>
                <div className="space-y-3">
                  {PROCESSING_STEPS.map((step, idx) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: idx <= processingStep ? 1 : 0.3,
                        x: 0,
                        color: idx <= processingStep ? '#fff' : '#6b7280'
                      }}
                      className="flex items-center gap-3 text-sm font-medium"
                    >
                      {idx < processingStep ? (
                        <CheckCircle2 size={16} className="text-green-400" />
                      ) : idx === processingStep ? (
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-700" />
                      )}
                      {step}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : uploadSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-semibold text-white">Upload Complete!</h3>
                <p className="text-gray-400">Your document has been processed successfully.</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setUploadSuccess(false); }}
                  className="mt-4 px-6 py-2 bg-[#2d3748] rounded-lg text-sm font-medium text-white hover:bg-[#374151]"
                >
                  Upload Another
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-[#2d3748] rounded-full flex items-center justify-center text-indigo-400 mb-2">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-semibold text-white">Click to upload or drag and drop</h3>
                <p className="text-sm text-gray-500">PDF, JPG, PNG or CSV (max 10MB)</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Card / Tips */}
        <div className="bg-[#1a1d27] rounded-xl border border-[#2d3748] p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-indigo-400" />
            Supported Formats
          </h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span><strong>Bank Statements:</strong> Official PDFs from major banks (HDFC, SBI, ICICI, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span><strong>Credit Card Bills:</strong> Monthly statement PDFs showing transaction details.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span><strong>UPI History:</strong> Exported CSV/PDFs from PhonePe, GPay, or Paytm.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
              <span><strong>Invoices:</strong> Clear images or PDFs of bills and receipts.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Uploaded Documents Table */}
      <div className="bg-[#1a1d27] rounded-xl border border-[#2d3748] overflow-hidden">
        <div className="p-6 border-b border-[#2d3748]">
          <h3 className="text-lg font-semibold text-white">Uploaded Documents</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-[#2d3748] rounded-full flex items-center justify-center text-gray-500 mb-3">
              <FileText size={24} />
            </div>
            <p className="text-gray-400 font-medium">No documents uploaded yet</p>
            <p className="text-gray-600 text-sm mt-1">Upload your first document above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#11131a] text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Txns</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3748]">
                {documents.map((doc, index) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[#2d3748]/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-indigo-400" />
                        <span className="font-medium text-white">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {DOC_TYPES.find(t => t.id === doc.document_type)?.label || doc.document_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(doc.upload_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-white font-medium">
                      {doc.transaction_count || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === 'processed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle2 size={12} /> Done
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertCircle size={12} /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Loader2 size={12} className="animate-spin" /> Processing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
