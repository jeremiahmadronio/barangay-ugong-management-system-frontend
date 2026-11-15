import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { userService } from '@/config/api/users/users.service'

export function useUserPermissions() {
  const { user } = useContext(AuthContext)
  const [permissions, setPermissions] = useState<string[]>(() => {
    if (user?.permissions && user.permissions.length > 0) return user.permissions
    try {
      const stored = sessionStorage.getItem('user_permissions')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => permissions.length === 0)

  useEffect(() => {
    let isMounted = true
    userService
      .getCurrentUserDetail()
      .then((detail) => {
        if (!isMounted || !detail) return
        const permNames = (detail.customPermissions || [])
          .map((p) => p.permissionName || p.module || '')
          .filter(Boolean)
        setPermissions(permNames)
        sessionStorage.setItem('user_permissions', JSON.stringify(permNames))
      })
      .catch((err) => {
        console.error('Failed to load user permissions:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const hasPermission = (targetPermission: string): boolean => {
    const role = (user?.role || sessionStorage.getItem('user_role') || '').toLowerCase()
    if (role === 'rootadmin' || role === 'system_admin') {
      return true
    }

    const normTarget = targetPermission.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    const baseTarget = normTarget.replace(/s$/, '')
    return permissions.some((p) => {
      const normP = p.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
      const baseP = normP.replace(/s$/, '')
      if (normP === normTarget || baseP === baseTarget) return true
      if (normTarget.includes('complaint') || normTarget.includes('caseentry')) {
        return normP.includes('complaint') || normP.includes('caseentry')
      }
      if (normTarget.includes('note') && normP.includes('note')) {
        return true
      }
      if (normTarget.includes('mediation') && normP.includes('mediation')) {
        return true
      }
      if (normTarget.includes('conciliation') && normP.includes('conciliation')) {
        return true
      }
      if (
        (normTarget.includes('cfa') || normTarget.includes('certifiedtofileaction')) &&
        (normP.includes('cfa') || normP.includes('certifiedtofileaction'))
      ) {
        return true
      }
      if (normTarget.includes('reopen') && normP.includes('reopen')) {
        return true
      }
      if (normTarget.includes('settle') && normP.includes('settle')) {
        return true
      }
      if (normTarget.includes('dismiss') && normP.includes('dismiss')) {
        return true
      }
      if (normTarget.includes('edit') && normP.includes('edit')) {
        return true
      }
      if (
        (normTarget.includes('lupon') || normTarget.includes('escalate')) &&
        (normP.includes('lupon') || normP.includes('escalate'))
      ) {
        return true
      }
      if (normTarget.includes('permanent') && normP.includes('permanent')) {
        return true
      }
      if (
        normTarget.includes('delete') &&
        !normTarget.includes('permanent') &&
        normP.includes('delete') &&
        !normP.includes('permanent')
      ) {
        return true
      }
      if (normTarget.includes('restore') && normP.includes('restore')) {
        return true
      }
      if (normTarget.includes('archive') && normP.includes('archive')) {
        return true
      }
      return false
    })
  }

  return { permissions, isLoading, hasPermission }
}

