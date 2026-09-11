export const ENDPOINTS = {
  // Auth endpoints (Spring Boot /api/v1/auth)
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    VERIFY_MFA: '/api/v1/auth/verify-mfa',
    RESEND_OTP: '/api/v1/auth/resend-otp',
    SEND_BACKUP_OTP: '/api/v1/auth/send-backup-otp',
    CHANGE_PASSWORD_NEW_ACCOUNT: '/api/v1/auth/change-password-new-account',
    INITIATE_BACKUP_EMAIL: '/api/v1/auth/backup-email/initiate',
    VERIFY_BACKUP_EMAIL: '/api/v1/auth/backup-email/verify',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    FORGOT_PASSWORD_VERIFY: '/api/v1/auth/forgot-password/verify-code',
    FORGOT_PASSWORD_RESET: '/api/v1/auth/forgot-password/reset',
  },

  // System Admin (Root)
ROOTADMIN: {
  USERS: {
    STATS: '/api/v1/users/stats',
    TABLE: '/api/v1/users/table',
    CREATE_USERS: '/api/v1/users',
    CREATE_ADMIN: '/api/v1/users/create-admin',
    GET_DETAILS: (id: number | string) => `/api/v1/users/${id}/details`,
    UPDATE_USERS: (id: number | string) => `/api/v1/users/${id}`,
    UPDATE_ADMIN: (id: number | string) => `/api/v1/users/update-admin/${id}`,
    UPDATE_STATUS: (id: number | string) => `/api/v1/users/${id}/status`,
    LOCK_UNLOCK: (id: number | string) => `/api/v1/users/${id}/lock`,
    ARCHIVE: (id: number | string) => `/api/v1/users/${id}/archive`,
    RESTORE: (id: number | string) => `/api/v1/users/${id}/restore`,
    DELETE: (id: number | string) => `/api/v1/users/${id}`,
  },
    BACKUP: '/api/v1/rootadmin/backup',
    AUDIT_LOGS: '/api/v1/audit-logs',
    AUDIT_LOGS_STATS: '/api/v1/audit-logs/stats',
  },

  // Barangay Admin & System Users
  ADMIN: {
    USERS: '/api/v1/users',
    OFFICERS: '/api/v1/officers',
  },

  // Officers Directory & Management
  OFFICERS: {
    BASE: '/api/v1/officers',
    STATS: '/api/v1/officers/stats',
    TABLE: '/api/v1/officers/table',
    CREATE: '/api/v1/officers',
    UPDATE: (id: string | number) => `/api/v1/officers/${id}`,
    UPDATE_STATUS: (id: string | number) => `/api/v1/officers/${id}/status`,
    DELETE: (id: string | number) => `/api/v1/officers/${id}`,
    CASES: (id: string | number) => `/api/v1/officers/${id}/cases`,
  },

  // Residents
  RESIDENTS: {
    BASE: '/api/v1/residents',
    STATS: '/api/v1/residents/stats',
    TABLE: '/api/v1/residents/table',
    SUGGESTIONS: '/api/v1/residents/suggestions',
    RELATIVES: '/api/v1/residents/relatives',
    SEARCH_ACTIVE: '/api/v1/residents/search-active',
    GET_DETAILS: (id: string | number) => `/api/v1/residents/${id}/details`,
    UPDATE: (id: string | number) => `/api/v1/residents/${id}`,
    UPDATE_STATUS: (id: string | number) => `/api/v1/residents/${id}/status`,
    ARCHIVE: (id: string | number) => `/api/v1/residents/${id}/archive`,
    RESTORE: (id: string | number) => `/api/v1/residents/${id}/restore`,
    DELETE: (id: string | number) => `/api/v1/residents/${id}`,
  },

  // Department Modules
  BLOTTER: '/api/v1/blotter',
  LUPON: '/api/v1/lupon',
  VAWC: '/api/v1/vawc',
  BCPC: '/api/v1/bcpc',
  CLEARANCE: '/api/v1/clearance',



  FTJS: {
    BASE: '/api/v1/ftjs',
    STATS: '/api/v1/ftjs/stats',
    DASHBOARD_STATS: '/api/v1/ftjs/dashboard-stats',
    SUMMARY: '/api/v1/ftjs/summary',
    SEARCH_RESIDENT: '/api/v1/ftjs/search-resident',
    RESIDENT_PROFILE: (residentId: number | string) => `/api/v1/ftjs/resident/${residentId}`,
    ENTRY: '/api/v1/ftjs/entry',
    DETAIL: (id: number | string) => `/api/v1/ftjs/detail/${id}`,
    RE_ISSUANCE_REQUEST: (id: number | string) => `/api/v1/ftjs/re-issuance-request/${id}`,
    RE_ISSUANCE_HISTORY: (id: number | string) => `/api/v1/ftjs/${id}/re-issuances/history`,
    TIMELINE: (id: number | string) => `/api/v1/ftjs/${id}/timeline/`,
    NOTES_ENTRY: (id: number | string) => `/api/v1/ftjs/notes-entry/${id}`,
    NOTES_HISTORY: (id: number | string) => `/api/v1/ftjs/notes-history/${id}`,
    ARCHIVE: (id: number | string) => `/api/v1/ftjs/archive/${id}`,
    RESTORE: (id: number | string) => `/api/v1/ftjs/restore/${id}`,
    ARCHIVE_STATS: '/api/v1/ftjs/archive/stats',
    ARCHIVE_SUMMARY: '/api/v1/ftjs/archives/summary',
    TRASH_SUMMARY: '/api/v1/ftjs/trash/summary',
    SOFT_DELETE: (id: number | string) => `/api/v1/ftjs/${id}`,
    PERMANENT_DELETE: (id: number | string) => `/api/v1/ftjs/trash/${id}/permanent`,
    BATCH_PERMANENT_DELETE: '/api/v1/ftjs/trash/permanent/batch',
    RETENTION_SETTING: '/api/v1/ftjs/display-retention',
    UPDATE_RETENTION: '/api/v1/ftjs/update-retention',
    TREND: '/api/v1/ftjs/trend',
    EDUCATION_DISTRIBUTION: '/api/v1/ftjs/education-distribution',
    PURPOSE_DISTRIBUTION: '/api/v1/ftjs/purpose-distribution',
    ISSUANCE_DISTRIBUTION: '/api/v1/ftjs/issuance-distribution',
    REPORTS_TABLE: '/api/v1/ftjs/reports/table',
    REPORTS_KPI: '/api/v1/ftjs/reports/kpi',
  },

  SHARED: {
    DEPARTMENTS: '/api/v1/departments',

    PERMISSIONS: '/api/v1/permissions',
    AVAILABLE_PERSONS: '/api/v1/persons/available-for-user',
    CHECK_EMAIL: '/api/v1/users/check-email',
    ROLES: '/api/v1/shared/roles',
    PERMISSIONS_BY_ROLE: (roleCode: string) => `/api/v1/shared/permissions/${roleCode}`,
    BARANGAY_INFO: '/api/v1/shared/barangay',
    PUROKS: '/api/v1/shared/puroks',
    DASHBOARD_STATS: '/api/v1/shared/stats',
  },
} as const
