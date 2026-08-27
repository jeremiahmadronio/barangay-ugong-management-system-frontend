import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  getNavItemsForRole,
  type NavItem,
} from '@/config/navigation.config'
import type { UserRole } from '@/types'
import ugongLogo from '@/assets/ugong-logo.png'

export function Sidebar() {
  const { currentRole } = useAuth()
  const navItems = getNavItemsForRole(currentRole)
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const isPathActive = (targetPath: string) => {
    const [targetPathname] = targetPath.split('?')
    if (location.pathname === targetPathname) return true
    if (
      targetPathname !== '/' &&
      targetPathname !== '/blotter' &&
      targetPathname !== '/lupon' &&
      targetPathname !== '/vawc' &&
      targetPathname !== '/bcpc' &&
      targetPathname !== '/clearance' &&
      targetPathname !== '/ftjs' &&
      location.pathname.startsWith(targetPathname)
    ) {
      return true
    }
    return false
  }

  useEffect(() => {
    const initialOpenGroups: Record<string, boolean> = {}

    navItems.forEach((item) => {
      if (!item.children || item.children.length === 0) return
      const hasActiveChild = item.children.some((child) => isPathActive(child.path))
      if (hasActiveChild) {
        initialOpenGroups[item.label] = true
      }
    })

    if (Object.keys(initialOpenGroups).length > 0) {
      setOpenGroups((prev) => ({ ...initialOpenGroups, ...prev }))
    }
  }, [location.pathname, navItems])

  const roleConfig: Record<
    UserRole,
    { displayName: string; brand: string; brandColor: string }
  > = {
    admin: { displayName: 'Administrator', brand: 'Admin Portal', brandColor: 'text-blue-600' },
    blotter: { displayName: 'Blotter Officer', brand: 'Blotter Desk', brandColor: 'text-emerald-600' },
    official: { displayName: 'Barangay Official', brand: 'Kapitana Portal', brandColor: 'text-amber-600' },
    lupon: { displayName: 'Lupong Tagapamayapa', brand: 'Lupon Portal', brandColor: 'text-indigo-600' },
    bcpc: { displayName: 'BCPC Officer', brand: 'BCPC Desk', brandColor: 'text-teal-600' },
    clearance: { displayName: 'Clearance Officer', brand: 'Clearance Desk', brandColor: 'text-cyan-600' },
    vawc: { displayName: 'VAWC Officer', brand: 'VAWC Desk', brandColor: 'text-rose-600' },
    ftjs: { displayName: 'First Time Job Seeker', brand: 'FTJS Desk', brandColor: 'text-green-600' },
    rootadmin: { displayName: 'System Admin', brand: 'System Admin', brandColor: 'text-purple-600' },
  }

  const currentRoleConfig = roleConfig[currentRole] || roleConfig.official

  return (
    <aside className="hidden md:flex flex-col h-screen z-40 sticky top-0 bg-white border-r border-slate-200 w-60 select-none">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header: Logo + Brand */}
        <div className="flex items-center h-16 flex-shrink-0 border-b border-slate-100 px-4">
          <img
            src={ugongLogo}
            alt="Barangay Ugong Logo"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-slate-200 shadow-xs"
            loading="eager"
            draggable={false}
          />
          <div className="flex items-center flex-1 min-w-0 ml-3">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1 truncate">
                Brgy. Ugong, Valenzuela
              </p>
              <h1 className="text-sm font-extrabold text-slate-800 leading-tight truncate">
                <span className={currentRoleConfig.brandColor}>{currentRoleConfig.brand}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <p className="px-2.5 mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </p>

          <div className="flex flex-col gap-0.5">
            {navItems.map((item: NavItem) => {
              const hasChildren = !!item.children?.length

              if (hasChildren) {
                const groupOpen =
                  openGroups[item.label] ??
                  item.children!.some((child) => isPathActive(child.path))

                const hasActiveChild = item.children!.some((child) =>
                  isPathActive(child.path)
                )

                return (
                  <div key={item.path || item.label} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [item.label]: !groupOpen,
                        }))
                      }
                      className={`relative flex items-center w-full transition-all duration-200 group px-2.5 py-2 rounded-lg cursor-pointer ${
                        hasActiveChild
                          ? 'text-blue-700 bg-blue-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`relative z-10 flex items-center justify-center ${
                          hasActiveChild ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>

                      <span className="relative z-10 ml-2.5 text-sm font-medium whitespace-nowrap truncate flex-1 text-left">
                        {item.label}
                      </span>

                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          groupOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {groupOpen && (
                      <div className="ml-7 mr-1 space-y-0.5 border-l border-slate-200 pl-2">
                        {item.children!.map((child) => {
                          const isChildActive = isPathActive(child.path)
                          const ChildIcon = child.icon
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                isChildActive
                                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <ChildIcon className="w-3.5 h-3.5" />
                              <span>{child.label}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path === '/blotter' ||
                    item.path === '/lupon' ||
                    item.path === '/vawc' ||
                    item.path === '/bcpc' ||
                    item.path === '/clearance' ||
                    item.path === '/ftjs' ||
                    item.path === '/dashboard' ||
                    item.path === '/'
                  }
                  className={({ isActive }) =>
                    `relative flex items-center w-full transition-all duration-200 group px-2.5 py-2 rounded-lg ${
                      isActive
                        ? 'text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Background Animation */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBackground"
                          className="absolute inset-0 bg-blue-50 rounded-lg"
                          initial={false}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}

                      {/* Active Border Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBorder"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-600 rounded-r-full"
                          initial={false}
                        />
                      )}

                      <div
                        className={`relative z-10 flex items-center justify-center ${
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>

                      <span className="relative z-10 ml-2.5 text-sm font-medium whitespace-nowrap truncate">
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
