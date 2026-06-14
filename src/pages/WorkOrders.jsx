import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function WorkOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ progress: '', shelf_status: '' })
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('progress')) setFilters(f => ({ ...f, progress: searchParams.get('progress') }))
  }, [])

  const fetchOrders = useCallback(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (filters.progress !== '') p.set('progress', filters.progress)
    if (filters.shelf_status) p.set('shelf_status', filters.shelf_status)
    setLoading(true)
    api.get(`/workorders?${p}`).then(data => { setOrders(data); setLoading(false) }).catch(() => setLoading(false))
  }, [search, filters])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        {user?.role === 'wizard' && (
          <Link
            to="/workorders/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Work Order
          </Link>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name, description, WO#, invoice#…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.progress}
          onChange={e => setFilter('progress', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Progress</option>
          <option value="0">Not Done</option>
          <option value="1">Done</option>
        </select>
        <select
          value={filters.shelf_status}
          onChange={e => setFilter('shelf_status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All Shelves</option>
          <option value="INCOMING">Incoming</option>
          <option value="OUTGOING">Outgoing</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['WO #', 'Client', 'Description', 'Due Date', 'Priority', 'Shelf', 'Status', 'Progress', 'Paid'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No work orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/workorders/${o.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                    {o.work_order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{o.client_name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{o.short_description || o.job_description}</td>
                <td className="px-4 py-3 text-gray-600">{o.due_date || '—'}</td>
                <td className="px-4 py-3">
                  <PriorityBadge level={o.priority_level} delivery={o.delivery_required} />
                </td>
                <td className="px-4 py-3">
                  <ShelfBadge status={o.shelf_status} />
                </td>
                <td className="px-4 py-3 text-gray-500">{o.status || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.progress ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.progress ? 'Done' : 'In Progress'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {o.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PriorityBadge({ level, delivery }) {
  const effective = delivery ? Math.min(10, level + 1) : level
  const color = effective >= 8 ? 'bg-red-100 text-red-700' : effective >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {effective}{delivery ? ' +D' : ''}
    </span>
  )
}

function ShelfBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'INCOMING' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
      {status === 'INCOMING' ? 'Incoming' : 'Outgoing'}
    </span>
  )
}
