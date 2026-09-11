import { api } from '../apiClients';

export interface Official {
  id: number;
  name: string;
  position: string;
  type: string; // 'CAPTAIN', 'KAGAWAD', 'STAFF'
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const officialApi = {
  // Public endpoint
  getPublicOfficials: async (): Promise<Official[]> => {
    return await api.get('/api/public/officials', { requiresAuth: false });
  },

  // Admin endpoints
  getOfficials: async (): Promise<Official[]> => {
    return await api.get('/api/officials');
  },

  createOfficial: async (formData: FormData): Promise<Official> => {
    return await api.post('/api/officials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateOfficial: async (id: number, formData: FormData): Promise<Official> => {
    return await api.put(`/api/officials/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteOfficial: async (id: number): Promise<void> => {
    await api.delete(`/api/officials/${id}`);
  },

  archiveOfficial: async (id: number): Promise<void> => {
    await api.patch(`/api/officials/${id}/archive`);
  }
};
