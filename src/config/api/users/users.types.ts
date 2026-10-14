export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'ARCHIVED'
export type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL'


export interface DepartmentResponse {
  id: number
  name: string
}


export interface PermissionResponse {  
    id: number
    permissionName: string
    module: string
}


export interface StatMetric {
  count: number
  percentageChange: number
  trendDirection: TrendDirection
  trendText: string
}

export interface UserCountRawStats {
  currentTotal: number
  previousTotal: number
  currentActive: number
  previousActive: number
  currentLocked: number
  previousLocked: number
  currentInactive: number
  previousInactive: number
}

export interface UserManagementStatsResponse {
  totalUsers: StatMetric
  activeUsers: StatMetric
  lockedUsers: StatMetric
  inactiveUsers: StatMetric
}


export interface AdminCreateRequest {
  personId: number
  systemEmail: string
  systemBackupEmail?: string
  isActivated?: boolean
}

export interface AdminUpdateRequest {
  systemEmail: string
  systemBackupEmail?: string
  isActivated?: boolean
}

export interface UserCreateRequest {
  personId: number
  systemEmail: string
  systemBackupEmail?: string
  departmentIds: number[]
  permissionIds?: number[]
  isActivated?: boolean
}

export interface UserUpdateRequest {
  systemEmail: string
  systemBackupEmail?: string
  departmentIds: number[]
  permissionIds?: number[]
  isActivated?: boolean
}

export interface UserFilterRequest {
  search?: string
  roleName?: string
  departmentName?: string
  status?: UserStatus
}

export interface UserLockRequest {
  isLocked: boolean
  lockDurationMinutes?: number
  reason?: string
}

export interface UserStatusUpdateRequest {
  status: UserStatus
  remarks?: string
}

export interface UserArchiveRequest {
  remarks?: string
}

export interface UpdatePersonalInfoRequest {
  firstName?: string
  lastName?: string
  username?: string
  contactNumber?: string
}

export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ==========================================
// RESPONSE DTOs (Data received from Backend)
// ==========================================
export interface UserResponse {
  id: number
  username?: string
  systemEmail: string
  status: UserStatus
  isNewAccount: boolean
  personId?: number
  personFullName?: string
  roleId?: number
  roleName?: string
  departments?: string[]
  customPermissions?: string[]
  createdAt?: string // ISO LocalDateTime string from Java
}

export interface UserTableResponse {
  id: number
  photoBase64?: string
  fullName: string
  firstName?: string
  lastName?: string
  username?: string
  systemEmail: string
  roleName: string
  accountType?: string
  departmentAccess?: string[]
  status: UserStatus
  isLocked: boolean
  lastLoginAt?: string
  createdAt?: string
}

export interface PersonSummaryInfo {
  personId: number
  photoBase64?: string
  fullName: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  gender?: string
  birthDate?: string 
  age?: number
  civilStatus?: string
  contactNumber?: string
  completeAddress?: string
  occupation?: string
}

export interface UserActivityResponse {
  id: number
  actionTaken: string
  module: string
  severity: string
  reason?: string
  ipAddress?: string
  timestamp?: string
}

export interface UserDetailResponse {
  id: number
  photoBase64?: string
  username?: string
  systemEmail: string
  systemBackupEmail?: string
  roleId?: number
  roleName?: string
  accountType?: string
  status: UserStatus
  isLocked: boolean
  isNewAccount: boolean
  totpEnabled?: boolean

  personInfo?: PersonSummaryInfo

  departments?: DepartmentResponse[]
  customPermissions?: PermissionResponse[]

  lastLoginAt?: string
  failedAttempts?: number
  lockUntil?: string
  statusRemarks?: string
  recentActivities?: UserActivityResponse[]

  // 5. Audit Trail Timestamps
  createdAt?: string
  updatedAt?: string
  archivedAt?: string
  archiveRemarks?: string
}

export interface TotpSetupResponse {
  secret: string
  qrCode: string
}

export interface TotpConfirmationRequest {
  secret: string
  code: string
}

export interface TotpEnableSuccessResponse {
  status: string
}