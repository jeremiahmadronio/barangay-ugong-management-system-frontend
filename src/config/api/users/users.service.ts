// src/config/api/users/users.service.ts
import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'
import type {
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
} from './users.types'

export const userService = {
  /**
   * 1. GET /api/v1/users/{userId}/details
   * Fetch detailed user profile for viewing
   */
  getUserDetail: async (userId: number | string): Promise<UserDetailResponse> => {
    const response = await axiosInstance.get<UserDetailResponse>(
      ENDPOINTS.ROOTADMIN.USERS.GET_DETAILS(userId)
    )
    return response.data
  },

  /**
   * 2. GET /api/v1/users/stats
   * Fetch User Management Dashboard statistics
   */
  getUserStats: async (): Promise<UserManagementStatsResponse> => {
    const response = await axiosInstance.get<UserManagementStatsResponse>(
      ENDPOINTS.ROOTADMIN.USERS.STATS
    )
    return response.data
  },

  /**
   * 3. GET /api/v1/users/table
   * Fetch user table list with search and filter parameters
   */
  getUsersTable: async (filter?: UserFilterRequest): Promise<UserTableResponse[]> => {
    const response = await axiosInstance.get<UserTableResponse[]>(
      ENDPOINTS.ROOTADMIN.USERS.TABLE,
      { params: filter }
    )
    return response.data
  },

  /**
   * 4. POST /api/v1/users
   * Create a new Officer user account
   */
  createUser: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await axiosInstance.post<UserResponse>(
      ENDPOINTS.ROOTADMIN.USERS.CREATE_USERS,
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
      ENDPOINTS.ROOTADMIN.USERS.CREATE_ADMIN,
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
      ENDPOINTS.ROOTADMIN.USERS.UPDATE_USERS(userId),
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
      ENDPOINTS.ROOTADMIN.USERS.UPDATE_ADMIN(userId),
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
      ENDPOINTS.ROOTADMIN.USERS.UPDATE_STATUS(userId),
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
      ENDPOINTS.ROOTADMIN.USERS.LOCK_UNLOCK(userId),
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
      ENDPOINTS.ROOTADMIN.USERS.ARCHIVE(userId),
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
      ENDPOINTS.ROOTADMIN.USERS.RESTORE(userId)
    )
    return response.data
  },

  /**
   * 12. DELETE /api/v1/users/{userId}
   * Permanently delete a user account
   */
  deleteUser: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ROOTADMIN.USERS.DELETE(userId))
  },
}