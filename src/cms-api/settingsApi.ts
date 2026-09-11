import { api } from '../apiClients';

export const settingsApi = {
  // Public GET
  getAllSettings: async (): Promise<Record<string, string>> => {
    try {
      return await api.get('/api/settings', { requiresAuth: false });
    } catch (error) {
      console.error("Error fetching settings:", error);
      return {};
    }
  },

  // Secure PUT (Note: Controller uses POST for updates)
  updateSettings: async (settings: Record<string, string>): Promise<Record<string, string>> => {
    return await api.post('/api/settings', settings);
  },

  // Secure File Upload for images
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/settings/upload', formData, {
      headers: { 
        // DO NOT set Content-Type, let the browser set it with boundary
      }
    });
    
    // Returns { url: "/uploads/..." }
    // Construct full URL pointing to the backend
    const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
    return `${BASE_URL}${response.url}`;
  }
};
