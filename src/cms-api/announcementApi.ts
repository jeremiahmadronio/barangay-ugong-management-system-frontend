const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const API_URL = `${BASE_URL}/api/v1/cms/announcements`;

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {};
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

export const announcementApi = {
    // Public fetch
    getPublicAnnouncements: async () => {
        const response = await fetch(`${API_URL}/public`);
        if (!response.ok) throw new Error("Failed to fetch public announcements");
        return response.json();
    },

    // Admin fetch
    getAllAnnouncements: async () => {
        const response = await fetch(`${API_URL}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch announcements");
        return response.json();
    },

    // Create (supports file upload)
    createAnnouncement: async (formData: FormData) => {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData
        });
        if (!response.ok) throw new Error("Failed to create announcement");
        return response.json();
    },

    // Update
    updateAnnouncement: async (id: number, formData: FormData) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: formData
        });
        if (!response.ok) throw new Error("Failed to update announcement");
        return response.json();
    },

    // Delete
    deleteAnnouncement: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to delete announcement");
        // Delete endpoint returns 204 No Content typically, or true. Let's just return true.
        return true; 
    },

    // Toggle publish
    togglePublish: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}/toggle-publish`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to toggle publish status");
        return response.json();
    },

    // Archive
    archiveAnnouncement: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}/archive`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to archive announcement");
        return response.json();
    }
};
