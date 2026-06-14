import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function ShelfView() {
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/workorders?shelf_status=INCOMING&progress=0'),
      api.get('/workorders?shelf_status=OUTGOING&progress=0')
    ]).then(([inc, out]) => {
      setIncoming(inc.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')))
      setOutgoing(out.sort((a, b) => (a.physical_location || '').localeCompare(b.physical_location || '')))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-400 mt-8">Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shelf View</h1>
      <div className="grid grid-cols-2 gap-6">
        <ShelfPanel
          title="Incoming"
          subtitle="Sorted by due date — soonest first"
          items={incoming}
          color="blue"
          columnLabel="Due Date"
          columnValue={o => o.due_date || '—'}
        />
        <ShelfPanel
          title="Outgoing"
          subtitle="Sorted by shelf location"
          items={outgoing}
          color="orange"
          columnLabel="Location"
          columnValue={o => o.physical_location || '—'}
        />
      </div>
    </div>
  )
}

function ShelfPanel({ title, subtitle, items, color, columnLabel, columnValue }) {
  const colors = {
    blue: { header: 'bg-blue-600 text-white', row: 'hover:bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
    orange: { header: 'bg-orange-500 text-white', row: 'hover:bg-orange-50', badge: 'bg-orange-100 text-orange-700' }
  }
  const c = colors[color]

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className={`px-5 py-4 ${c.header}`}>
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-xs opacity-80 mt-0.5">{subtitle}</p>
        <p className="text-sm mt-1 opacity-90">{items.length} job{items.length !== 1 ? 's' : ''}</p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-gray-400 text-sm">No jobs on {title.toLowerCase()} shelf</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">WO #</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{columnLabel}</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(o => (
              <tr key={o.id} className={`${c.row} transition-colors`}>
                <td className="px-4 py-2.5">
                  <Link to={`/workorders/${o.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                    {o.work_order_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{o.client_name}</td>
                <td className="px-4 py-2.5 text-gray-600">{columnValue(o)}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.badge}`}>
                    {o.delivery_required ? Math.min(10, o.priority_level + 1) : o.priority_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
