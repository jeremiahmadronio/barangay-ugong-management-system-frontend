import { http } from '../client'
import { ENDPOINTS } from '../endpoints'

export interface LoginPayload {
  username: string
  password?: string
}

export interface LoginResponseData {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponseData> => {
    return http.post<LoginResponseData>(ENDPOINTS.AUTH.LOGIN, payload)
  },

  verifyMfa: async (payload: { code: string }): Promise<LoginResponseData> => {
    return http.post<LoginResponseData>(ENDPOINTS.AUTH.VERIFY_MFA, payload)
  },

  resendOtp: async (email: string): Promise<void> => {
    return http.post<void>(`${ENDPOINTS.AUTH.RESEND_OTP}?email=${encodeURIComponent(email)}`)
  },

  forgotPassword: async (email: string): Promise<void> => {
    return http.post<void>(`${ENDPOINTS.AUTH.FORGOT_PASSWORD}?email=${encodeURIComponent(email)}`)
  },
}
