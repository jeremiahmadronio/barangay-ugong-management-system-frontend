import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import {
  Calendar,
  Clock,
  ChevronDown,
  User,
  Shield,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const MainLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  // Live Date & Time timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserMenuOpen])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-2xs">
          {/* Left: spacer so center/right stay aligned */}
          <div />

          {/* Center: Live Date & Time Widget */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-slate-50 to-blue-50/60 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">{formatDate(currentTime)}</span>
            </div>
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold tabular-nums text-slate-800">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          {/* Right: User Menu Dropdown */}
          <div ref={userMenuRef} className="relative">
            {(() => {
              const isSysAdmin = user?.role === 'rootadmin' || user?.role === 'admin'
              const displayName =
                user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : isSysAdmin
                    ? 'Administrator'
                    : user?.name || 'User'
              const subtext = user?.username
                ? `@${user.username}`
                : user?.email ||
                (user?.role === 'rootadmin'
                  ? 'System Administrator'
                  : user?.role === 'admin'
                    ? 'Barangay Administrator'
                    : 'Barangay Official')

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {user?.photoUrl || user?.avatarUrl ? (
                      <img
                        src={user.photoUrl || user.avatarUrl}
                        alt={displayName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shadow-2xs"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight">
                        {subtext}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {/* Dropdown Popup */}
                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
                      {/* Compact Context Header */}
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                            {user?.role === 'rootadmin' ? 'Root Admin' : user?.role === 'admin' ? 'Barangay Admin' : 'Staff'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {user?.email || (user?.username ? `@${user.username}` : displayName)}
                        </p>
                      </div>

                      {/* Menu Options */}
                      <div className="p-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            navigate('/settings?tab=profile');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>My Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            navigate('/settings?tab=security');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span>Security & Audit</span>
                        </button>
                      </div>

                      {/* Sign Out */}
                      <div className="p-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
