export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  status: 'MFA_REQUIRED' | 'CHANGE_PASSWORD_REQUIRED' | 'SUCCESS'
  userId: number | string
  role: string
  departments?: string[]
  token?: string
  totpEnabled?: boolean
  hasBackupEmail?: boolean
  firstName?: string
  lastName?: string
  username?: string
  photoUrl?: string
}

export interface MfaRequest {
  email: string
  code: string
  type: 'EMAIL' | 'BACKUP' | 'TOTP'
}

export interface VerifyCodeRequest {
  email: string
  code: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  email: string
  newPassword: string
  confirmPassword: string
}
