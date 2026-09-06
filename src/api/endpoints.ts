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
  USERS: {
    BASE: '/api/v1/users',
    STATS: '/api/v1/users/stats',
    DETAIL: (id: string | number) => `/api/v1/users/${id}`,
    OFFICERS: '/api/v1/officers',
  },

  // Residents
  RESIDENTS: {
    BASE: '/api/v1/residents',
    DETAIL: (id: string | number) => `/api/v1/residents/${id}`,
  },

  // Department Modules
  BLOTTER: {
    BASE: '/api/v1/blotter',
    DETAIL: (id: string | number) => `/api/v1/blotter/${id}`,
    EXTEND: (id: string | number) => `/api/v1/blotter/${id}/extend`,
  },
  LUPON: {
    BASE: '/api/v1/lupon',
    TABLE: '/api/v1/lupon/table',
    STATS: '/api/v1/lupon/stats',
    DETAIL: (id: string | number) => `/api/v1/lupon/${id}`,
    EXTEND: (caseId: string | number) => `/api/v1/lupon/${caseId}/extend`,
    PANGKAT: (caseId: string | number) => `/api/v1/lupon/${caseId}/pangkat`,
    CONCILIATION_SESSIONS: (caseId: string | number) => `/api/v1/lupon/${caseId}/conciliation`,
    CANCEL_CONCILIATION: (sessionId: string | number) => `/api/v1/lupon/conciliation/${sessionId}/cancel`,
    CONCILIATION_MINUTES: (sessionId: string | number) => `/api/v1/lupon/conciliation/${sessionId}/minutes`,
    CONCILIATION_FOLLOWUP: (sessionId: string | number) => `/api/v1/lupon/conciliation/${sessionId}/followup`,
  },
  VAWC: {
    BASE: '/api/v1/vawc',
    TABLE: '/api/v1/vawc/table',
    STATS: '/api/v1/vawc/stats',
    DETAIL: (id: string | number) => `/api/v1/vawc/${id}`,
    NOTES: (caseId: string | number) => `/api/v1/vawc/${caseId}/notes`,
    TIMELINE: (caseId: string | number) => `/api/v1/vawc/${caseId}/timeline`,
    ACTIVATE_BPO: (caseId: string | number) => `/api/v1/vawc/${caseId}/bpo/activate`,
    SERVE_BPO: (caseId: string | number) => `/api/v1/vawc/${caseId}/bpo/serve`,
    NARRATIVE_FILE: (caseId: string | number) => `/api/v1/vawc/files/narrative/${caseId}`,
    EVIDENCE_FILE: (evidenceId: string | number) => `/api/v1/vawc/files/evidence/${evidenceId}`,
    WITNESS_FILE: (witnessId: string | number) => `/api/v1/vawc/files/witness/${witnessId}`,
    CREATE_REFERRAL: '/api/v1/vawc/create-referral',
    CFA_DETAIL: (caseId: string | number) => `/api/v1/vawc/cfa-detail/${caseId}`,
  },
  BCPC: {
    BASE: '/api/v1/bcpc',
    DETAIL: (id: string | number) => `/api/v1/bcpc/${id}`,
  },
  CLEARANCE: {
    BASE: '/api/v1/clearance',
    DETAIL: (id: string | number) => `/api/v1/clearance/${id}`,
  },
  FTJS: {
    BASE: '/api/v1/ftjs',
    DETAIL: (id: string | number) => `/api/v1/ftjs/${id}`,
  },
} as const
