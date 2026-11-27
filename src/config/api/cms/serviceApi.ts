const API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/v1/cms/services`;

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

export const serviceApi = {
    // Get all public services
    getPublicServices: async () => {
        const response = await fetch(`${API_URL}/public`);
        if (!response.ok) throw new Error("Failed to fetch public services");
        return response.json();
    },

    // Get all services (admin)
    getAllServices: async () => {
        const response = await fetch(API_URL, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch services");
        return response.json();
    },

    // Create
    createService: async (serviceData: any) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(serviceData)
        });
        if (!response.ok) throw new Error("Failed to create service");
        return response.json();
    },

    // Update
    updateService: async (id: number, serviceData: any) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(serviceData)
        });
        if (!response.ok) throw new Error("Failed to update service");
        return response.json();
    },

    // Delete
    deleteService: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to delete service");
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
    archiveService: async (id: number) => {
        const response = await fetch(`${API_URL}/${id}/archive`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to archive service");
        return response.json();
    }
};
