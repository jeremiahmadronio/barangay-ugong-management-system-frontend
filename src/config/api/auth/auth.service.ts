import { axiosInstance } from '@/config/api/axios.config'
import { ENDPOINTS } from '@/config/api/endpoints.config'
import type {
  LoginRequest,
  LoginResponse,
  MfaRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from './auth.types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, data)
    return response.data
  },

  verifyMfa: async (data: MfaRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(ENDPOINTS.AUTH.VERIFY_MFA, data)
    return response.data
  },

  resendOtp: async (email: string): Promise<void> => {
    await axiosInstance.post(ENDPOINTS.AUTH.RESEND_OTP, null, {
      params: { email },
    })
  },

  forgotPassword: async (email: string): Promise<void> => {
    await axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, null, {
      params: { email },
    })
  },

  verifyResetCode: async (data: VerifyCodeRequest): Promise<void> => {
    await axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY, data)
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, data)
  },

  changePasswordNewAccount: async (data: ChangePasswordRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      ENDPOINTS.AUTH.CHANGE_PASSWORD_NEW_ACCOUNT,
      data
    )
    return response.data
  },
}
