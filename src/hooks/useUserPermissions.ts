import { useAuth } from '@/hooks/useAuth'

export function useUserPermissions() {
  const { user, permissionsLoading } = useAuth()
  const permissions = user?.permissions ?? []
  const isLoading = permissionsLoading && permissions.length === 0

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
        if (normTarget.includes('ftjs') && !normP.includes('ftjs')) return false
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
      if (normTarget.includes('bpo') && normP.includes('bpo')) {
        return true
      }
      if (normTarget.includes('referral') && normP.includes('referral')) {
        return true
      }
      if (
        (normTarget.includes('custody') || normTarget.includes('turnover')) &&
        (normP.includes('custody') || normP.includes('turnover'))
      ) {
        return true
      }
      if (
        (normTarget.includes('intervention') || normTarget.includes('monitoring')) &&
        (normP.includes('intervention') || normP.includes('monitoring'))
      ) {
        return true
      }
      if (normTarget.includes('close') && normP.includes('close')) {
        return true
      }
      if (
        (normTarget.includes('reissue') || normTarget.includes('reissuance')) &&
        (normP.includes('reissue') || normP.includes('reissuance'))
      ) {
        if (normTarget.includes('ftjs') && !normP.includes('ftjs')) return false
        return true
      }
      if (
        (normTarget.includes('issue') || normTarget.includes('issuance')) &&
        !normTarget.includes('reissue') &&
        (normP.includes('issue') || normP.includes('issuance')) &&
        !normP.includes('reissue')
      ) {
        if (normTarget.includes('ftjs') && !normP.includes('ftjs')) return false
        if (normTarget.includes('clearance') && !normP.includes('clearance')) return false
        return true
      }
      if (normTarget.includes('view') && normP.includes('view')) {
        if (normTarget.includes('ftjs') && !normP.includes('ftjs')) return false
        if (normTarget.includes('clearance') && !normP.includes('clearance')) return false
        return true
      }
      return false
    })
  }

  return { permissions, isLoading, hasPermission }
}

