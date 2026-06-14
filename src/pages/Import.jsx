import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Import() {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()

  if (user?.role !== 'wizard') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Import</h1>
        <p className="text-gray-500">Wizard role required to import jobs.</p>
      </div>
    )
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://localhost:3001/api/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      setResult(await res.json())
    } catch (e) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import from POS</h1>
      <p className="text-sm text-gray-500 mb-6">
        Weekly job refresh from your POS system. Upload the export file to import new work orders.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>Setup required:</strong> POS file format is pending confirmation. Provide a sample export file to complete this integration. Fields that will be mapped: invoice number, job description, due date.
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        onClick={() => inputRef.current.click()}
      >
        <p className="text-gray-500 text-sm">{file ? file.name : 'Click to select a file, or drag and drop'}</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={e => { setFile(e.target.files[0]); setResult(null) }}
        />
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Uploading…' : 'Upload & Import'}
        </button>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-xl text-sm ${result.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
