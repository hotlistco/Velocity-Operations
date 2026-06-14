import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function AlertBanner() {
  const [alerts, setAlerts] = useState({ overdue: [], due_soon: [] })

  useEffect(() => {
    const fetch = () => api.get('/notifications/alerts').then(setAlerts).catch(() => {})
    fetch()
    const id = setInterval(fetch, 60_000)
    return () => clearInterval(id)
  }, [])

  const overdueCount = alerts.overdue?.length ?? 0
  const soonCount = alerts.due_soon?.length ?? 0
  if (!overdueCount && !soonCount) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-6 text-sm shrink-0">
      {overdueCount > 0 && (
        <Link to="/workorders?progress=0" className="text-red-700 font-semibold hover:underline">
          {overdueCount} overdue job{overdueCount !== 1 ? 's' : ''}
        </Link>
      )}
      {soonCount > 0 && (
        <Link to="/workorders?progress=0" className="text-amber-700 font-medium hover:underline">
          {soonCount} job{soonCount !== 1 ? 's' : ''} due soon
        </Link>
      )}
    </div>
  )
}
