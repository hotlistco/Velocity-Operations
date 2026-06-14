import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const TABS = ['General', 'Email Templates', 'Users']

export default function Settings() {
  const { user } = useAuth()
  const isWizard = user?.role === 'wizard'
  const [tab, setTab] = useState('General')

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.filter(t => isWizard || t === 'General').map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'General' && <GeneralSettings isWizard={isWizard} />}
      {tab === 'Email Templates' && isWizard && <EmailTemplates />}
      {tab === 'Users' && isWizard && <UserManagement />}
    </div>
  )
}

function GeneralSettings({ isWizard }) {
  const [form, setForm] = useState({ alert_threshold_days: '3', shop_name: '', shop_email: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/notifications/settings').then(s => setForm(f => ({ ...f, ...s }))).catch(() => {})
  }, [])

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/notifications/settings', form)
      setMsg('Saved')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Shop Name" value={form.shop_name} onChange={v => setForm(f => ({ ...f, shop_name: v }))} disabled={!isWizard} />
      <Field label="Shop Email" value={form.shop_email} onChange={v => setForm(f => ({ ...f, shop_email: v }))} disabled={!isWizard} />
      <Field label="Due Soon Alert Threshold (days)" value={form.alert_threshold_days} onChange={v => setForm(f => ({ ...f, alert_threshold_days: v }))} type="number" disabled={!isWizard} />
      {isWizard && (
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      )}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">Gmail API</p>
        <p className="text-sm text-gray-500">
          Gmail API credentials must be configured to enable email notifications. See the development setup guide.
          Store credentials securely in the database — never hardcode them.
        </p>
      </div>
    </form>
  )
}

function EmailTemplates() {
  const [templates, setTemplates] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/notifications/templates').then(setTemplates)
  }, [])

  async function save() {
    setSaving(true)
    try {
      await api.put(`/notifications/templates/${editing.type}`, { subject: editing.subject, body: editing.body })
      setTemplates(ts => ts.map(t => t.type === editing.type ? editing : t))
      setMsg('Saved')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  const labels = { overdue: 'Overdue Notification', complete: 'Job Complete Notification' }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Templates support variables: <code className="bg-gray-100 px-1 rounded">{'{{client_name}}'}</code>{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{job_description}}'}</code>{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{due_date}}'}</code>
      </p>
      {templates.map(tpl => (
        <div key={tpl.type} className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-3">{labels[tpl.type] || tpl.type}</h3>
          {editing?.type === tpl.type ? (
            <div className="space-y-3">
              <input
                value={editing.subject}
                onChange={e => setEditing(d => ({ ...d, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={editing.body}
                onChange={e => setEditing(d => ({ ...d, body: e.target.value }))}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 items-center">
                <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                  Cancel
                </button>
                {msg && <span className="text-sm text-green-600">{msg}</span>}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-1">Subject: {tpl.subject}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{tpl.body}</p>
              <button onClick={() => setEditing({ ...tpl })} className="mt-3 text-sm text-blue-600 hover:underline">
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '', role: 'apprentice', email: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => { api.get('/auth/users').then(setUsers) }, [])

  async function addUser(e) {
    e.preventDefault()
    try {
      const u = await api.post('/auth/users', form)
      setUsers(us => [...us, u])
      setForm({ username: '', password: '', role: 'apprentice', email: '' })
      setMsg('User created')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg(e.message)
    }
  }

  async function deleteUser(id) {
    if (!confirm('Remove this user?')) return
    await api.delete(`/auth/users/${id}`)
    setUsers(us => us.filter(u => u.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Username', 'Role', 'Email', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'wizard' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role === 'wizard' ? 'Wizard' : 'Apprentice'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteUser(u.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Add User</h3>
        <form onSubmit={addUser} className="grid grid-cols-2 gap-3">
          <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Email (optional)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="apprentice">Apprentice</option>
            <option value="wizard">Wizard</option>
          </select>
          <div className="col-span-2 flex items-center gap-3">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Add User
            </button>
            {msg && <span className="text-sm text-green-600">{msg}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  )
}
