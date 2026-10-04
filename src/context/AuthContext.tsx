import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'

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
