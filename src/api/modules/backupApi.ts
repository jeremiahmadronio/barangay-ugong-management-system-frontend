import { apiClient } from '@/apiClients';
import { ENDPOINTS } from '@/api/endpoints';

export interface BackupItem {
  id?: number;
  fileName: string;
  label?: string;
  createdBy?: string;
  createdAt: string;
  fileSizeKb: number;
  type: string;
  status: string;
  deletedAt?: string;
  scheduledPurgeAt?: string;
  daysRemaining?: number;
  s3Bucket?: string;
}

export interface BackupStats {
  storageUsedGb: number;
  storageLimitGb: number;
  autoBackupFrequency: string;
  nextBackupTime: string;
  lastBackupStatus: string;
  lastBackupDate: string;
  isBackupInProgress: boolean;
  backupProgressStatus: string;
  s3Bucket: string;
  s3Region: string;
}

export interface BackupScheduleConfig {
  id: number;
  frequency: string;
  hour: number;
  minute: number;
  dayOfWeek?: string;
  dayOfMonth?: string;
  enabled: boolean;
}

export interface TriggerBackupPayload {
  label?: string;
  reason?: string;
}

export interface UpdateSchedulePayload {
  frequency?: string;
  hour?: number;
  minute?: number;
  dayOfWeek?: string;
  dayOfMonth?: string;
  enabled?: boolean;
}

export const backupApi = {
  /** Trigger manual backup to AWS S3 */
  triggerBackup: async (payload?: TriggerBackupPayload): Promise<BackupItem> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.TRIGGER, {
      method: 'POST',
      body: payload || {},
    });
  },

  /** Get list of all backups from S3 and Database */
  getBackups: async (): Promise<BackupItem[]> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.LIST, {
      method: 'GET',
    });
  },

  /** Get backup storage and scheduler statistics */
  getStats: async (): Promise<BackupStats> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.STATS, {
      method: 'GET',
    });
  },

  /** Download backup file from AWS S3 with stream progress tracking and abort support */
  downloadBackup: async (
    fileName: string,
    onProgress?: (loadedBytes: number, totalBytes: number) => void,
    signal?: AbortSignal
  ): Promise<Blob> => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
    const url = `${baseUrl}${ENDPOINTS.ROOTADMIN.BACKUP.DOWNLOAD(fileName)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.message || errorMsg;
      } catch {
        const text = await response.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body || !onProgress) {
      return response.blob();
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        onProgress(receivedBytes, totalBytes);
      }
    }

    return new Blob(chunks as any);
  },

  /** Restore a soft-deleted backup */
  restoreBackup: async (fileName: string): Promise<void> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.RESTORE(fileName), {
      method: 'POST',
    });
  },

  /** Delete a backup from AWS S3 */
  deleteBackup: async (fileName: string): Promise<void> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.DELETE(fileName), {
      method: 'DELETE',
    });
  },

  /** Get current automated backup schedule */
  getSchedule: async (): Promise<BackupScheduleConfig> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.GET_SCHEDULE, {
      method: 'GET',
    });
  },

  /** Update automated backup schedule */
  updateSchedule: async (payload: UpdateSchedulePayload): Promise<BackupScheduleConfig> => {
    return apiClient(ENDPOINTS.ROOTADMIN.BACKUP.UPDATE_SCHEDULE, {
      method: 'PUT',
      body: payload,
    });
  },
};
