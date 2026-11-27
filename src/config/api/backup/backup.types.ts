export interface BackupItem {
  id?: number
  fileName: string
  label?: string
  createdBy?: string
  createdAt: string
  fileSizeKb: number
  type: string
  status: string
  deletedAt?: string
  scheduledPurgeAt?: string
  daysRemaining?: number
  s3Bucket?: string
}

export interface BackupStats {
  storageUsedGb: number
  storageLimitGb: number
  autoBackupFrequency: string
  nextBackupTime: string
  lastBackupStatus: string
  lastBackupDate: string
  isBackupInProgress: boolean
  backupProgressStatus: string
  s3Bucket: string
  s3Region: string
}

export interface BackupScheduleConfig {
  id: number
  frequency: string
  hour: number
  minute: number
  dayOfWeek?: string
  dayOfMonth?: string
  enabled: boolean
}

export interface TriggerBackupPayload {
  label?: string
  reason?: string
}

export interface UpdateSchedulePayload {
  frequency?: string
  hour?: number
  minute?: number
  dayOfWeek?: string
  dayOfMonth?: string
  enabled?: boolean
}
