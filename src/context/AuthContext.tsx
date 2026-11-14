import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { userService } from '@/config/api/users/users.service'

interface AuthContextType {
  user: User | null
  currentRole: UserRole
  setRole: (role: UserRole) => void
  login: (userData: User) => void
  logout: () => void
  updateUser: (partialData: Partial<User>) => void
}

const getStoredUser = (): User | null => {
  try {
    const saved = sessionStorage.getItem('user_profile')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const getStoredRole = (): UserRole => {
  try {
    const savedRole = sessionStorage.getItem('user_role') as UserRole
    if (savedRole) return savedRole
  } catch {
    // fallback
  }
  return 'official'
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  currentRole: 'official',
  setRole: () => {},
  login: () => {},
  logout: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [currentRole, setCurrentRole] = useState<UserRole>(getStoredRole)

  // Sync latest user profile details (including photo) from backend on mount
  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) return

    let isMounted = true
    userService.getCurrentUserDetail()
      .then((details) => {
        if (!isMounted || !details) return
        setUser((prev) => {
          if (!prev) return prev
          const photo = details.photoBase64 || undefined
          const personFullName =
            details.personInfo?.fullName ||
            [details.personInfo?.firstName, details.personInfo?.lastName].filter(Boolean).join(' ').trim()
          const permissionNames = (details.customPermissions || []).map((p) => p.permissionName || p.module || '').filter(Boolean)
          const updated: User = {
            ...prev,
            name: personFullName || (prev.name && !prev.name.includes('@') ? prev.name : personFullName) || prev.name,
            username: details.username || prev.username,
            firstName: details.personInfo?.firstName || prev.firstName,
            lastName: details.personInfo?.lastName || prev.lastName,
            email: details.systemEmail || prev.email,
            photoUrl: photo,
            avatarUrl: photo,
            contactNumber: details.personInfo?.contactNumber || undefined,
            totpEnabled: typeof details.totpEnabled === 'boolean' ? details.totpEnabled : prev.totpEnabled,
            permissions: permissionNames,
          }
          sessionStorage.setItem('user_profile', JSON.stringify(updated))
          sessionStorage.setItem('user_permissions', JSON.stringify(permissionNames))
          return updated
        })
      })
      .catch((err) => {
        console.debug('Background profile sync in AuthProvider skipped:', err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user_profile', JSON.stringify(user))
    } else {
      sessionStorage.removeItem('user_profile')
    }
  }, [user])

  useEffect(() => {
    sessionStorage.setItem('user_role', currentRole)
  }, [currentRole])

  const setRole = (role: UserRole) => {
    setCurrentRole(role)
    if (user) {
      setUser({ ...user, role })
    }
  }

  const login = (userData: User) => {
    setUser(userData)
    setCurrentRole(userData.role)
    sessionStorage.setItem('user_profile', JSON.stringify(userData))
    sessionStorage.setItem('user_role', userData.role)
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('user_profile')
    sessionStorage.removeItem('user_role')
    sessionStorage.removeItem('token')
    try {
      localStorage.removeItem('barangay_user_profile_custom')
      if (user?.id) {
        localStorage.removeItem(`barangay_user_profile_${user.id}`)
      }
    } catch {}
  }

  const updateUser = (partialData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...partialData }
      sessionStorage.setItem('user_profile', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, currentRole, setRole, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
