import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import AlertBanner from './AlertBanner'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <AlertBanner />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
