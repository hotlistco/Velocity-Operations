import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workorders', label: 'Work Orders' },
  { to: '/shelf', label: 'Shelf View' },
  { to: '/import', label: 'Import' },
  { to: '/settings', label: 'Settings' }
]

export default function NavBar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <span className="font-bold tracking-tight">Velocity Operations</span>
        <div className="flex gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm px-3 py-1.5 rounded transition-colors ${
                pathname.startsWith(to) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-400">
          {user?.username}
          {' · '}
          <span className={user?.role === 'wizard' ? 'text-yellow-400' : 'text-blue-400'}>
            {user?.role === 'wizard' ? 'Wizard' : 'Apprentice'}
          </span>
        </span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}
