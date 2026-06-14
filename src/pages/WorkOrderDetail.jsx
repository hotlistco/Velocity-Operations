import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const EMPTY = {
  client_name: '', client_phone: '', client_email: '',
  invoice_number: '', job_description: '', short_description: '',
  special_services: '', due_date: '', priority_level: 5,
  delivery_required: false, physical_location: '', shelf_status: 'INCOMING',
  status: '', notes: ''
}

export default function WorkOrderDetail({ isNew }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isWizard = user?.role === 'wizard'

  const [order, setOrder] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showEmailModal, setShowEmailModal] = useState(null)
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isNew) return
    api.get(`/workorders/${id}`).then(data => {
      setOrder({ ...data, delivery_required: !!data.delivery_required, progress: !!data.progress, paid: !!data.paid })
      setLoading(false)
    }).catch(() => navigate('/workorders'))
  }, [id])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const res = await api.post('/workorders', order)
        navigate(`/workorders/${res.id}`)
      } else {
        await api.patch(`/workorders/${id}`, order)
        setSuccess('Saved')
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this work order?')) return
    await api.delete(`/workorders/${id}`)
    navigate('/workorders')
  }

  async function openEmailModal(type) {
    const templates = await api.get('/notifications/templates')
    const tpl = templates.find(t => t.type === type)
    const subject = (tpl?.subject || '')
      .replace('{{job_description}}', order.short_description || order.job_description || '')
    const body = (tpl?.body || '')
      .replace(/{{client_name}}/g, order.client_name || '')
      .replace(/{{job_description}}/g, order.short_description || order.job_description || '')
      .replace(/{{due_date}}/g, order.due_date || '')
    setEmailDraft({ subject, body })
    setShowEmailModal(type)
  }

  async function handleSendEmail() {
    setSending(true)
    try {
      await api.post('/notifications/send', {
        to_email: order.client_email,
        subject: emailDraft.subject,
        body: emailDraft.body
      })
      setShowEmailModal(null)
      setSuccess('Email sent')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  function field(key) {
    return {
      value: order[key] ?? '',
      onChange: e => setOrder(o => ({ ...o, [key]: e.target.value }))
    }
  }

  function Field({ label, name, type = 'text', disabled, textarea }) {
    const isDisabled = disabled || (!isWizard && isWizardField(name))
    const base = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500'
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
        {textarea
          ? <textarea {...field(name)} disabled={isDisabled} rows={4} className={base} />
          : <input type={type} {...field(name)} disabled={isDisabled} className={base} />
        }
      </div>
    )
  }

  if (loading) return <p className="text-gray-400 mt-8">Loading…</p>

  const effectivePriority = order.delivery_required ? Math.min(10, (order.priority_level || 5) + 1) : (order.priority_level || 5)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/workorders" className="text-sm text-gray-500 hover:text-gray-700">← Work Orders</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {isNew ? 'New Work Order' : order.work_order_number}
          </h1>
          {!isNew && <p className="text-sm text-gray-500">Invoice: {order.invoice_number || '—'}</p>}
        </div>
        {!isNew && isWizard && (
          <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800 px-3 py-1.5 border border-red-200 rounded-lg">
            Delete
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <Section title="Client">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Client Name *" name="client_name" />
            <Field label="Phone" name="client_phone" type="tel" />
            <Field label="Email" name="client_email" type="email" />
          </div>
        </Section>

        <Section title="Job">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Invoice Number" name="invoice_number" />
            <Field label="Due Date" name="due_date" type="date" />
          </div>
          <Field label="Job Description" name="job_description" textarea />
          <div className="mt-4">
            <Field label="Short Description" name="short_description" />
          </div>
          <div className="mt-4">
            <Field label="Special Services" name="special_services" textarea />
          </div>
        </Section>

        <Section title="Status & Shelf">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Priority Level (1–10)
                {order.delivery_required && <span className="ml-2 text-blue-600">Effective: {effectivePriority}</span>}
              </label>
              <input
                type="number" min={1} max={10}
                value={order.priority_level ?? 5}
                onChange={e => setOrder(o => ({ ...o, priority_level: parseInt(e.target.value) }))}
                disabled={!isWizard}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Shelf Status</label>
              <select
                value={order.shelf_status || 'INCOMING'}
                onChange={e => setOrder(o => ({ ...o, shelf_status: e.target.value }))}
                disabled={!isWizard}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-gray-50"
              >
                <option value="INCOMING">Incoming</option>
                <option value="OUTGOING">Outgoing</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Physical Location" name="physical_location" />
            <Field label="Status" name="status" />
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!order.delivery_required}
                onChange={e => setOrder(o => ({ ...o, delivery_required: e.target.checked }))}
                disabled={!isWizard}
                className="rounded"
              />
              Delivery Required (+1 priority)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!order.progress}
                onChange={e => setOrder(o => ({ ...o, progress: e.target.checked ? 1 : 0 }))}
                className="rounded"
              />
              Done
            </label>
            {isWizard && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!order.paid}
                  onChange={e => setOrder(o => ({ ...o, paid: e.target.checked ? 1 : 0 }))}
                  className="rounded"
                />
                Paid
              </label>
            )}
          </div>
        </Section>

        <Section title="Notes">
          <Field label="Notes" name="notes" textarea />
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Create Work Order' : 'Save Changes'}
          </button>

          {!isNew && order.client_email && (
            <>
              <button
                type="button"
                onClick={() => openEmailModal('complete')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
              >
                Email: Job Complete
              </button>
              <button
                type="button"
                onClick={() => openEmailModal('overdue')}
                className="px-4 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50"
              >
                Email: Overdue
              </button>
            </>
          )}
        </div>
      </form>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl">
            <h2 className="font-bold text-lg mb-1">Send Email</h2>
            <p className="text-sm text-gray-500 mb-4">To: {order.client_email} · {order.client_phone && <span>📞 {order.client_phone}</span>}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
                <input
                  value={emailDraft.subject}
                  onChange={e => setEmailDraft(d => ({ ...d, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Body</label>
                <textarea
                  value={emailDraft.body}
                  onChange={e => setEmailDraft(d => ({ ...d, body: e.target.value }))}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send Email'}
              </button>
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function isWizardField(name) {
  const wizardOnly = new Set([
    'client_name', 'client_phone', 'client_email', 'invoice_number',
    'job_description', 'short_description', 'special_services',
    'due_date', 'priority_level', 'delivery_required', 'physical_location', 'shelf_status', 'paid'
  ])
  return wizardOnly.has(name)
}
