import { axiosInstance } from '../axios.config'
import { ENDPOINTS } from '../endpoints.config'
import type {
  UserResponse,
  UserDetailResponse,
  UserTableResponse,
  UserManagementStatsResponse,
  UserFilterRequest,
  UserCreateRequest,
  UserUpdateRequest,
  UserStatusUpdateRequest,
  UserLockRequest,
  UserArchiveRequest,
} from '../users/users.types'

export const systemUsersService = {
  /**
   * GET /api/v1/system-users/stats
   * Fetch Month-over-Month dashboard statistics for System Users only
   */
  getStats: async (): Promise<UserManagementStatsResponse> => {
    const response = await axiosInstance.get<UserManagementStatsResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.STATS
    )
    return response.data
  },

  /**
   * GET /api/v1/system-users/table
   * Fetch filtered table data for System Users only
   */
  getTable: async (filter?: UserFilterRequest): Promise<UserTableResponse[]> => {
    const response = await axiosInstance.get<UserTableResponse[]>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.TABLE,
      { params: filter }
    )
    return response.data
  },

  /**
   * GET /api/v1/system-users/{id}/details
   * Fetch detailed profile for a System User
   */
  getDetail: async (userId: number | string): Promise<UserDetailResponse> => {
    const response = await axiosInstance.get<UserDetailResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.GET_DETAILS(userId)
    )
    return response.data
  },

  /**
   * POST /api/v1/system-users
   * Create a new System User (Officer) account
   */
  create: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await axiosInstance.post<UserResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.CREATE,
      data
    )
    return response.data
  },

  /**
   * PUT /api/v1/system-users/{id}
   * Update an existing System User account
   */
  update: async (userId: number | string, data: UserUpdateRequest): Promise<UserResponse> => {
    const response = await axiosInstance.put<UserResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.UPDATE(userId),
      data
    )
    return response.data
  },

  /**
   * PATCH /api/v1/system-users/{id}/status
   * Update account status (ACTIVE / INACTIVE)
   */
  updateStatus: async (
    userId: number | string,
    data: UserStatusUpdateRequest
  ): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.UPDATE_STATUS(userId),
      data
    )
    return response.data
  },

  /**
   * PATCH /api/v1/system-users/{id}/lock
   * Lock or unlock account
   */
  lockUnlock: async (userId: number | string, data: UserLockRequest): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.LOCK_UNLOCK(userId),
      data
    )
    return response.data
  },

  /**
   * PATCH /api/v1/system-users/{id}/archive
   * Archive account (Soft Archive)
   */
  archive: async (userId: number | string, data?: UserArchiveRequest): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.ARCHIVE(userId),
      data
    )
    return response.data
  },

  /**
   * PATCH /api/v1/system-users/{id}/restore
   * Restore archived or soft-deleted account back to active
   */
  restore: async (userId: number | string): Promise<UserResponse> => {
    const response = await axiosInstance.patch<UserResponse>(
      ENDPOINTS.ADMIN.SYSTEM_USERS.RESTORE(userId)
    )
    return response.data
  },

  /**
   * DELETE /api/v1/system-users/{id}
   * Soft-delete account (Move to trash)
   */
  delete: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.SYSTEM_USERS.DELETE(userId))
  },

  /**
   * DELETE /api/v1/system-users/{id}/permanent
   * Permanently delete account
   */
  permanentDelete: async (userId: number | string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.ADMIN.SYSTEM_USERS.PERMANENT_DELETE(userId))
  },
}
