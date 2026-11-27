import { http } from '../client'
import type {
  LoginRequest,
  LoginResponse,
  MfaRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from './auth.types'

export const authService = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    http.post<LoginResponse>('/api/v1/auth/login', data),

  verifyMfa: (data: MfaRequest): Promise<LoginResponse> =>
    http.post<LoginResponse>('/api/v1/auth/verify-mfa', data),

  resendOtp: (email: string): Promise<void> =>
    http.post<void>('/api/v1/auth/resend-otp', null, {
      params: { email },
    }),

  forgotPassword: (email: string): Promise<void> =>
    http.post<void>('/api/v1/auth/forgot-password', null, {
      params: { email },
    }),

  verifyResetCode: (data: VerifyCodeRequest): Promise<void> =>
    http.post<void>('/api/v1/auth/forgot-password/verify-code', data),

  resetPassword: (data: ResetPasswordRequest): Promise<void> =>
    http.post<void>('/api/v1/auth/forgot-password/reset', data),

  changePasswordNewAccount: (data: ChangePasswordRequest): Promise<LoginResponse> =>
    http.post<LoginResponse>(
      '/api/v1/auth/change-password-new-account',
      data
    ),
}
