// src/config/api/users/users.service.ts
import { axiosInstance } from '../axios.config'
import { http } from '../client'
import type {
  User,
  UserResponse,
  UserDetailResponse,
  UserTableResponse,
  UserManagementStatsResponse,
  UserFilterRequest,
  UserCreateRequest,
  AdminCreateRequest,
  UserUpdateRequest,
  AdminUpdateRequest,
  UserStatusUpdateRequest,
  UserLockRequest,
  UserArchiveRequest,
  ArchivedUser,
  ArchiveSettingsResponse,
  ArchiveStatsResponse,
  UpdatePersonalInfoRequest,
  UpdatePasswordRequest,
  TotpSetupResponse,
  TotpConfirmationRequest,
  TotpEnableSuccessResponse,
} from './users.types'

export const userService = {
  /**
   * 1. GET /api/v1/users/{userId}/details
   * Fetch detailed user profile for viewing
   */
  getUserDetail: async (userId: number | string): Promise<UserDetailResponse> => {
    const response = await axiosInstance.get<UserDetailResponse>(
      `/api/v1/users/${userId}/details`
    )
    return response.data
  },

  /**
   * GET /api/v1/user-profile/me
   * Fetch current authenticated user's profile details
   */
  getCurrentUserDetail: async (): Promise<UserDetailResponse> => {
    const response = await axiosInstance.get<UserDetailResponse>(
      '/api/v1/user-profile/me'
    )
    return response.data
  },

  /**
   * 2. GET /api/v1/users/stats
   * Fetch User Management Dashboard statistics
   */
  getUserStats: async (): Promise<UserManagementStatsResponse> => {
    const response = await axiosInstance.get<UserManagementStatsResponse>(
      '/api/v1/users/stats'
    )
    return response.data
  },

  /**
   * 3. GET /api/v1/users/table
   * Fetch user table list with search and filter parameters
   */
  getUsersTable: async (filter?: UserFilterRequest): Promise<UserTableResponse[]> => {
    const response = await axiosInstance.get<UserTableResponse[]>(
      '/api/v1/users/table',
      { params: filter }
    )
    return response.data
  },

  getArchivedUsers: async (search?: string): Promise<ArchivedUser[]> => {
    const response = await axiosInstance.get<ArchivedUser[]>('/api/v1/users/archive/users', {
      params: { search },
    })
    return response.data
  },

  getTrashUsers: async (search?: string): Promise<ArchivedUser[]> => {
    const response = await axiosInstance.get<ArchivedUser[]>('/api/v1/users/archive/trash/users', {
      params: { search },
    })
    return response.data
  },

  getArchiveSettings: async (): Promise<ArchiveSettingsResponse> => {
    try {
      const response = await axiosInstance.get<ArchiveSettingsResponse>(
        '/api/v1/users/archive/settings'
      )
      return response.data
    } catch {
      return { autoDeleteEnabled: true, deleteAfterDays: 30 }
    }
  },

  updateArchiveSettings: async (
    payload: ArchiveSettingsResponse
  ): Promise<ArchiveSettingsResponse> => {
    try {
      const response = await axiosInstance.put<ArchiveSettingsResponse>(
        '/api/v1/users/archive/settings',
        payload
      )
      return response.data
    } catch {
      return payload
    }
  },

  getArchiveStats: async (): Promise<ArchiveStatsResponse> => {
    try {
      const response = await axiosInstance.get<ArchiveStatsResponse>('/api/v1/users/archive/stats')
      return response.data
    } catch {
      return {
        totalArchived: 0,
        totalArchivedResidents: 0,
        totalArchivedOfficers: 0,
        totalArchivedUsers: 0,
        totalDeleted: 0,
        totalDeletedResidents: 0,
        totalDeletedOfficers: 0,
        totalDeletedUsers: 0,
      }
    }
  },

  /**
   * 4. POST /api/v1/users
   * Create a new Officer user account
   */
  createUser: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await axiosInstance.post<UserResponse>(
      '/api/v1/users',
      data
    )
    return response.data
  },

  /**
   * 5. POST /api/v1/users/create-admin
   * Create a new Admin account
   */
  createAdmin: async (data: AdminCreateRequest): Promise<UserResponse> => {
    const response = await axiosInstance.post<UserResponse>(
      '/api/v1/users/create-admin',
      data
    )
    return response.data
  },

  /**
   * 6. PUT /api/v1/users/{userId}
   * Update an existing Officer user account
   */
  updateUser: async (
    userId: number | string,
    data: UserUpdateRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.put<UserResponse>(
      `/api/v1/users/${userId}`,
      data
    )
    return response.data
  },

  /**
   * 7. PUT /api/v1/users/update-admin/{userId}
   * Update an existing Admin account
   */
  updateAdmin: async (
    userId: number | string,
    data: AdminUpdateRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.put<UserResponse>(
      `/api/v1/users/update-admin/${userId}`,
      data
    )
    return response.data
  },

  /**
   * 8. PATCH /api/v1/users/{userId}/status
   * Update user status (ACTIVE / INACTIVE)
   */
  updateUserStatus: async (
    userId: number | string,
    data: UserStatusUpdateRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/users/${userId}/status`,
      data
    )
    return response.data
  },

  /**
   * 9. PATCH /api/v1/users/{userId}/lock
   * Lock or unlock a user account
   */
  lockUnlockUser: async (
    userId: number | string,
    data: UserLockRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/users/${userId}/lock`,
      data
    )
    return response.data
  },

  /**
   * 10. PATCH /api/v1/users/{userId}/archive
   * Archive a user account (Soft Delete)
   */
  archiveUser: async (
    userId: number | string,
    data?: UserArchiveRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/users/${userId}/archive`,
      data
    )
    return response.data
  },

  /**
   * 11. PATCH /api/v1/users/{userId}/restore
   * Restore an archived user account
   */
  restoreUser: async (userId: number | string): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/users/${userId}/restore`
    )
    return response.data
  },

  /**
   * 12. DELETE /api/v1/users/{userId}
   * Permanently delete a user account
   */
  deleteUser: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/users/${userId}`)
  },

  permanentlyDeleteUser: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/users/${userId}/permanent`)
  },

  /**
   * 13. PUT /api/v1/user-profile/profile or /api/v1/user-profile/{userId}/profile
   * Partially update personal profile information (username, contactNumber, etc.)
   */
  updatePersonalInfo: async (
    data: UpdatePersonalInfoRequest,
    userId?: number | string
  ): Promise<UserResponse> => {
    const url = userId
      ? `/api/v1/user-profile/${userId}/profile`
      : '/api/v1/user-profile/profile'
    const response = await axiosInstance.put<UserResponse>(url, data)
    return response.data
  },

  /**
   * 14. POST /api/v1/user-profile/profile/photo or /api/v1/user-profile/{userId}/photo
   * Upload and update user profile photo
   */
  uploadProfilePhoto: async (
    file: File,
    userId?: number | string
  ): Promise<{ photo: string; message: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    const url = userId
      ? `/api/v1/user-profile/${userId}/photo`
      : '/api/v1/user-profile/profile/photo'

    const response = await axiosInstance.post<{ photo: string; message: string }>(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * 15. POST /api/v1/user-profile/change-password or /api/v1/user-profile/{userId}/change-password
   * Change account password with current password verification and complexity rules
   */
  changePassword: async (
    data: UpdatePasswordRequest,
    userId?: number | string
  ): Promise<{ message: string }> => {
    const url = userId
      ? `/api/v1/user-profile/${userId}/change-password`
      : '/api/v1/user-profile/change-password'
    const response = await axiosInstance.post<{ message: string }>(url, data)
    return response.data
  },

  /**
   * 16. GET /api/v1/user-profile/global-mfa
   * Fetch system-wide Global MFA status
   */
  getGlobalMfaStatus: async (): Promise<{ globalMfaEnabled: boolean }> => {
    const response = await axiosInstance.get<{ globalMfaEnabled: boolean }>(
      '/api/v1/user-profile/global-mfa'
    )
    return response.data
  },

  /**
   * 17. PUT /api/v1/user-profile/global-mfa
   * Toggle or set system-wide Global MFA status (Admin only)
   */
  updateGlobalMfa: async (
    enabled: boolean
  ): Promise<{ globalMfaEnabled: boolean; message: string }> => {
    const response = await axiosInstance.put<{
      globalMfaEnabled: boolean
      message: string
    }>('/api/v1/user-profile/global-mfa', { enabled })
    return response.data
  },

  /**
   * 18. GET /api/v1/user-profile/totp/setup
   * Initiate TOTP setup: generates temporary secret & Base64 QR code image
   */
  initiateTotpSetup: async (): Promise<TotpSetupResponse> => {
    const response = await axiosInstance.get<TotpSetupResponse>(
      '/api/v1/user-profile/totp/setup'
    )
    return response.data
  },

  /**
   * 19. POST /api/v1/user-profile/totp/verify
   * Verify 6-digit code and enable TOTP for the current user
   */
  verifyAndEnableTotp: async (
    data: TotpConfirmationRequest
  ): Promise<TotpEnableSuccessResponse> => {
    const response = await axiosInstance.post<TotpEnableSuccessResponse>(
      '/api/v1/user-profile/totp/verify',
      data
    )
    return response.data
  },

  /**
   * 20. POST /api/v1/user-profile/totp/disable
   * Disable TOTP authentication for the current user
   */
  disableTotp: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>(
      '/api/v1/user-profile/totp/disable'
    )
    return response.data
  },

  getSystemUserStats: async (): Promise<UserManagementStatsResponse> => {
    const response = await axiosInstance.get<UserManagementStatsResponse>(
      '/api/v1/system-users/stats'
    )
    return response.data
  },

  getSystemUserArchiveStats: async (): Promise<ArchiveStatsResponse> => {
    try {
      const response = await axiosInstance.get<ArchiveStatsResponse>(
        '/api/v1/system-users/archive/stats'
      )
      return response.data
    } catch {
      return {
        totalArchived: 0,
        totalArchivedResidents: 0,
        totalArchivedOfficers: 0,
        totalArchivedUsers: 0,
        totalDeleted: 0,
        totalDeletedResidents: 0,
        totalDeletedOfficers: 0,
        totalDeletedUsers: 0,
      }
    }
  },

  getSystemUsersTable: async (filter?: UserFilterRequest): Promise<UserTableResponse[]> => {
    const response = await axiosInstance.get<UserTableResponse[]>(
      '/api/v1/system-users/table',
      { params: filter }
    )
    return response.data
  },

  getArchivedSystemUsers: async (search?: string): Promise<ArchivedUser[]> => {
    const response = await axiosInstance.get<ArchivedUser[]>('/api/v1/system-users/archive/users', {
      params: { search },
    })
    return response.data
  },

  getTrashSystemUsers: async (search?: string): Promise<ArchivedUser[]> => {
    const response = await axiosInstance.get<ArchivedUser[]>(
      '/api/v1/system-users/archive/trash/users',
      { params: { search } }
    )
    return response.data
  },

  getSystemUserDetail: async (userId: number | string): Promise<UserDetailResponse> => {
    const response = await axiosInstance.get<UserDetailResponse>(
      `/api/v1/system-users/${userId}/details`
    )
    return response.data
  },

  createSystemUser: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await axiosInstance.post<UserResponse>('/api/v1/system-users', data)
    return response.data
  },

  updateSystemUser: async (
    userId: number | string,
    data: UserUpdateRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.put<UserResponse>(
      `/api/v1/system-users/${userId}`,
      data
    )
    return response.data
  },

  updateSystemUserStatus: async (
    userId: number | string,
    data: UserStatusUpdateRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/system-users/${userId}/status`,
      data
    )
    return response.data
  },

  lockUnlockSystemUser: async (
    userId: number | string,
    data: UserLockRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/system-users/${userId}/lock`,
      data
    )
    return response.data
  },

  archiveSystemUser: async (
    userId: number | string,
    data?: UserArchiveRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/system-users/${userId}/archive`,
      data
    )
    return response.data
  },

  restoreSystemUser: async (userId: number | string): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      `/api/v1/system-users/${userId}/restore`
    )
    return response.data
  },

  deleteSystemUser: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/system-users/${userId}`)
  },

  permanentlyDeleteSystemUser: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(`/api/v1/system-users/${userId}/permanent`)
  },

  getAll: async (): Promise<User[]> => {
    return http.get<User[]>('/api/v1/users')
  },

  getById: async (id: string | number): Promise<User> => {
    return http.get<User>(`/api/v1/users/${id}`)
  },

  create: async (data: Partial<User>): Promise<User> => {
    return http.post<User>('/api/v1/users', data)
  },

  update: async (id: string | number, data: Partial<User>): Promise<User> => {
    return http.put<User>(`/api/v1/users/${id}`, data)
  },

  delete: async (id: string | number): Promise<void> => {
    return http.delete<void>(`/api/v1/users/${id}`)
  },

  lockUnlock: async (id: string | number, locked: boolean): Promise<void> => {
    return http.patch<void>(`/api/v1/users/${id}/lock`, { locked })
  },
}