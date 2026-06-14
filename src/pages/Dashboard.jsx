import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Dashboard() {
  const [alerts, setAlerts] = useState({ overdue: [], due_soon: [] })
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/notifications/alerts').then(setAlerts).catch(() => {})
    api.get('/workorders').then(orders => {
      setStats({
        total: orders.length,
        done: orders.filter(o => o.progress).length,
        pending: orders.filter(o => !o.progress).length,
        unpaid: orders.filter(o => !o.paid && o.progress).length
      })
    }).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Jobs', value: stats.total, style: 'bg-blue-50 text-blue-800' },
            { label: 'In Progress', value: stats.pending, style: 'bg-yellow-50 text-yellow-800' },
            { label: 'Completed', value: stats.done, style: 'bg-green-50 text-green-800' },
            { label: 'Completed & Unpaid', value: stats.unpaid, style: 'bg-red-50 text-red-800' }
          ].map(({ label, value, style }) => (
            <div key={label} className={`rounded-xl p-5 ${style}`}>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <AlertList title="Overdue Jobs" items={alerts.overdue} color="red" />
        <AlertList title="Due Soon" items={alerts.due_soon} color="amber" />
      </div>
    </div>
  )
}

function AlertList({ title, items, color }) {
  const border = color === 'red' ? 'border-red-200' : 'border-amber-200'
  const bg = color === 'red' ? 'bg-red-50' : 'bg-amber-50'
  const heading = color === 'red' ? 'text-red-800' : 'text-amber-800'
  const link = color === 'red' ? 'text-red-700 hover:text-red-900' : 'text-amber-700 hover:text-amber-900'

  return (
    <div className={`rounded-xl border ${border} ${bg} p-5`}>
      <h2 className={`font-semibold mb-3 ${heading}`}>
        {title} <span className="font-normal">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">None</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 12).map(o => (
            <li key={o.id} className="text-sm">
              <Link to={`/workorders/${o.id}`} className={`hover:underline ${link}`}>
                <span className="font-mono text-xs mr-2">{o.work_order_number}</span>
                {o.client_name}
                <span className="text-gray-500 ml-2">({o.due_date})</span>
              </Link>
            </li>
          ))}
          {items.length > 12 && (
            <li className="text-sm text-gray-400">+ {items.length - 12} more</li>
          )}
        </ul>
      )}
    </div>
  )
}
