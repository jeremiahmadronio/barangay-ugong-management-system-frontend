import type { UserRole } from '@/types'

export function getRoleAndRouteFromBackend(
  role?: string,
  departments?: string[]
): { userRole: UserRole; targetRoute: string } {
  const roleKey = String(role ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
  const primaryDept =
    departments && departments.length > 0
      ? String(departments[0]).trim().toUpperCase().replace(/[\s-]+/g, '_')
      : ''

  if (
    roleKey === 'SYSTEM_ADMIN' ||
    roleKey === 'ROLE_SYSTEM_ADMIN' ||
    roleKey === 'ROOT_ADMIN' ||
    roleKey === 'ROLE_ROOT_ADMIN'
  ) {
    return { userRole: 'rootadmin', targetRoute: '/rootadmin/dashboard' }
  }

  if (roleKey === 'ADMIN' || roleKey === 'ROLE_ADMIN') {
    return { userRole: 'admin', targetRoute: '/admin/dashboard' }
  }

  switch (primaryDept) {
    case 'BLOTTER':
      return { userRole: 'blotter', targetRoute: '/blotter/docket' }
    case 'LUPON':
    case 'LUPONG_TAGAPAMAYAPA':
      return { userRole: 'lupon', targetRoute: '/lupon/cases' }
    case 'VAWC':
      return { userRole: 'vawc', targetRoute: '/vawc/cases' }
    case 'BCPC':
    case 'DCPC':
      return { userRole: 'bcpc', targetRoute: '/bcpc/cases' }
    case 'CLEARANCE':
      return { userRole: 'clearance', targetRoute: '/clearance/issued' }
    case 'FTJS':
    case 'FIRST_TIME_JOB_SEEKER':
      return { userRole: 'ftjs', targetRoute: '/ftjs/requests' }
    default:
      return { userRole: 'official', targetRoute: '/dashboard' }
  }
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'rootadmin':
      return '/rootadmin/dashboard'
    case 'admin':
      return '/admin/dashboard'
    case 'blotter':
      return '/blotter/docket'
    case 'lupon':
      return '/lupon/cases'
    case 'vawc':
      return '/vawc/cases'
    case 'bcpc':
      return '/bcpc/cases'
    case 'clearance':
      return '/clearance/issued'
    case 'ftjs':
      return '/ftjs/requests'
    case 'official':
    default:
      return '/dashboard'
  }
}
