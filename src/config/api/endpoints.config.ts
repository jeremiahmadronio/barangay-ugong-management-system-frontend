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
  FTJS: '/api/v1/ftjs',

  // ── Shared / Common (used across multiple features) ──────────────────────
  SHARED: {
    /** All active departments for select dropdowns */
    DEPARTMENTS: '/api/v1/departments',

    /** All available system permissions for checkbox lists */
    PERMISSIONS: '/api/v1/permissions',

    /** Search available residents/persons for user account creation */
    AVAILABLE_PERSONS: '/api/v1/persons/available-for-user',

    /** Check if a system email is taken by an active user */
    CHECK_EMAIL: '/api/v1/users/check-email',

    /** All available roles (Admin, Desk Officer, Viewer, etc.) */
    ROLES: '/api/v1/shared/roles',

    /** Permissions scoped to a specific role code — e.g. "ADMIN", "DESK_OFFICER" */
    PERMISSIONS_BY_ROLE: (roleCode: string) => `/api/v1/shared/permissions/${roleCode}`,

    /** Barangay info (name, municipality, province) */
    BARANGAY_INFO: '/api/v1/shared/barangay',

    /** Puroks / Sitios in the barangay — used in resident forms */
    PUROKS: '/api/v1/shared/puroks',

    /** Overall dashboard summary (user counts, case counts) */
    DASHBOARD_STATS: '/api/v1/shared/stats',
  },
} as const
