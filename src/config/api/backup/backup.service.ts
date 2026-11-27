import { apiClient } from '@/config/api/apiClients';
import type {
  BackupItem,
  BackupScheduleConfig,
  BackupStats,
  TriggerBackupPayload,
  UpdateSchedulePayload,
} from './backup.types';

export const backupService = {
  /** Trigger manual backup to AWS S3 */
  triggerBackup: async (payload?: TriggerBackupPayload): Promise<BackupItem> => {
    return apiClient('/api/v1/admin/backups/trigger', {
      method: 'POST',
      body: payload || {},
    });
  },

  /** Get list of all backups from S3 and Database */
  getBackups: async (): Promise<BackupItem[]> => {
    return apiClient('/api/v1/admin/backups', {
      method: 'GET',
    });
  },

  /** Get backup storage and scheduler statistics */
  getStats: async (): Promise<BackupStats> => {
    return apiClient('/api/v1/admin/backups/stats', {
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
    const baseUrl = (import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");
    const url = `${baseUrl}/api/v1/admin/backups/${encodeURIComponent(fileName)}/download`;
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
    return apiClient(`/api/v1/admin/backups/${encodeURIComponent(fileName)}/restore`, {
      method: 'POST',
    });
  },

  /** Delete a backup from AWS S3 */
  deleteBackup: async (fileName: string): Promise<void> => {
    return apiClient(`/api/v1/admin/backups/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });
  },

  /** Get current automated backup schedule */
  getSchedule: async (): Promise<BackupScheduleConfig> => {
    return apiClient('/api/v1/admin/backups/schedule', {
      method: 'GET',
    });
  },

  /** Update automated backup schedule */
  updateSchedule: async (payload: UpdateSchedulePayload): Promise<BackupScheduleConfig> => {
    return apiClient('/api/v1/admin/backups/schedule', {
      method: 'PUT',
      body: payload,
    });
  },
};
