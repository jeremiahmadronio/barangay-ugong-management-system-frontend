import { api } from '../apiClients'
import type {
  Announcement,
  CmsService,
  CmsServicePayload,
  CmsSettings,
  Event,
  EventCreateRequest,
  EventStatsResponse,
  EventUpdateRequest,
  Official,
  SettingsImageUploadResponse,
} from './cms.types'

const ANNOUNCEMENTS_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const ANNOUNCEMENTS_API_URL = `${ANNOUNCEMENTS_BASE_URL}/api/v1/cms/announcements`
const SERVICES_API_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api/v1/cms/services`

const getCmsAuthHeaders = (isFormData = false) => {
  const headers: Record<string, string> = {}
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

export const announcementService = {
  getPublicAnnouncements: async (): Promise<Announcement[]> => {
    const response = await fetch(`${ANNOUNCEMENTS_API_URL}/public`)
    if (!response.ok) throw new Error('Failed to fetch public announcements')
    return response.json()
  },

  getAllAnnouncements: async (): Promise<Announcement[]> => {
    const response = await fetch(ANNOUNCEMENTS_API_URL, {
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch announcements')
    return response.json()
  },

  createAnnouncement: async (formData: FormData): Promise<Announcement> => {
    const response = await fetch(ANNOUNCEMENTS_API_URL, {
      method: 'POST',
      headers: getCmsAuthHeaders(true),
      body: formData,
    })
    if (!response.ok) throw new Error('Failed to create announcement')
    return response.json()
  },

  updateAnnouncement: async (id: number, formData: FormData): Promise<Announcement> => {
    const response = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}`, {
      method: 'PUT',
      headers: getCmsAuthHeaders(true),
      body: formData,
    })
    if (!response.ok) throw new Error('Failed to update announcement')
    return response.json()
  },

  deleteAnnouncement: async (id: number): Promise<boolean> => {
    const response = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}`, {
      method: 'DELETE',
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete announcement')
    return true
  },

  togglePublish: async (id: number): Promise<Announcement> => {
    const response = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}/toggle-publish`, {
      method: 'PATCH',
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to toggle publish status')
    return response.json()
  },

  archiveAnnouncement: async (id: number): Promise<Announcement> => {
    const response = await fetch(`${ANNOUNCEMENTS_API_URL}/${id}/archive`, {
      method: 'PATCH',
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to archive announcement')
    return response.json()
  },
}

export const eventService = {
  getEvents: async (): Promise<Event[]> =>
    api.get('/api/v1/web-browsing/public/events', { requiresAuth: false }),

  getAdminEvents: async (): Promise<Event[]> =>
    api.get('/api/v1/events/table', { requiresAuth: true }).catch(() =>
      api.get('/api/v1/web-browsing/events', { requiresAuth: true })
    ),

  getEventStats: async (): Promise<EventStatsResponse> =>
    api.get('/api/v1/events/stats', { requiresAuth: true }),

  getEventsTable: async (params?: { search?: string; category?: string; status?: string }): Promise<Event[]> => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.category) query.append('category', params.category)
    if (params?.status) query.append('status', params.status)
    return api.get(`/api/v1/events/table?${query.toString()}`, { requiresAuth: true })
  },

  getEventById: async (id: number): Promise<Event> =>
    api.get(`/api/v1/events/${id}`, { requiresAuth: true }),

  createEvent: async (eventData: EventCreateRequest): Promise<Event> =>
    api.post('/api/v1/events', eventData, {
      requiresAuth: true,
      offlineDescription: `Create Event: ${eventData.title}`,
    }).catch(() =>
      api.post('/api/v1/web-browsing/events', eventData, {
        requiresAuth: true,
        offlineDescription: `Create Event: ${eventData.title}`,
      })
    ),

  updateEvent: async (id: number, eventData: EventUpdateRequest): Promise<Event> =>
    api.put(`/api/v1/events/${id}`, eventData, {
      requiresAuth: true,
      offlineDescription: `Update Event: ${eventData.title}`,
    }).catch(() =>
      api.put(`/api/v1/web-browsing/events/${id}`, eventData, {
        requiresAuth: true,
        offlineDescription: `Update Event: ${eventData.title}`,
      })
    ),

  updateEventStatus: async (id: number, status: string): Promise<Event> =>
    api.patch(`/api/v1/events/${id}/status`, { status }, {
      requiresAuth: true,
      offlineDescription: `Update Event Status: ${status}`,
    }),

  deleteEvent: async (id: number): Promise<void> =>
    api.delete(`/api/v1/events/${id}`, {
      requiresAuth: true,
      offlineDescription: `Delete Event ID: ${id}`,
    }).catch(() =>
      api.delete(`/api/v1/web-browsing/events/${id}`, {
        requiresAuth: true,
        offlineDescription: `Delete Event ID: ${id}`,
      })
    ),
}

export const officialService = {
  getPublicOfficials: async (): Promise<Official[]> =>
    await api.get('/api/public/officials', { requiresAuth: false }),

  getOfficials: async (): Promise<Official[]> =>
    await api.get('/api/officials'),

  createOfficial: async (formData: FormData): Promise<Official> =>
    await api.post('/api/officials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateOfficial: async (id: number, formData: FormData): Promise<Official> =>
    await api.put(`/api/officials/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteOfficial: async (id: number): Promise<void> => {
    await api.delete(`/api/officials/${id}`)
  },

  archiveOfficial: async (id: number): Promise<void> => {
    await api.patch(`/api/officials/${id}/archive`)
  },
}

export const servicesService = {
  getPublicServices: async (): Promise<CmsService[]> => {
    const response = await fetch(`${SERVICES_API_URL}/public`)
    if (!response.ok) throw new Error('Failed to fetch public services')
    return response.json()
  },

  getAllServices: async (): Promise<CmsService[]> => {
    const response = await fetch(SERVICES_API_URL, {
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch services')
    return response.json()
  },

  createService: async (serviceData: CmsServicePayload): Promise<CmsService> => {
    const response = await fetch(SERVICES_API_URL, {
      method: 'POST',
      headers: getCmsAuthHeaders(),
      body: JSON.stringify(serviceData),
    })
    if (!response.ok) throw new Error('Failed to create service')
    return response.json()
  },

  updateService: async (id: number, serviceData: CmsServicePayload): Promise<CmsService> => {
    const response = await fetch(`${SERVICES_API_URL}/${id}`, {
      method: 'PUT',
      headers: getCmsAuthHeaders(),
      body: JSON.stringify(serviceData),
    })
    if (!response.ok) throw new Error('Failed to update service')
    return response.json()
  },

  deleteService: async (id: number): Promise<boolean> => {
    const response = await fetch(`${SERVICES_API_URL}/${id}`, {
      method: 'DELETE',
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete service')
    return true
  },

  togglePublish: async (id: number): Promise<CmsService> => {
    const response = await fetch(`${SERVICES_API_URL}/${id}/toggle-publish`, {
      method: 'PATCH',
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to toggle publish status')
    return response.json()
  },

  archiveService: async (id: number): Promise<CmsService> => {
    const response = await fetch(`${SERVICES_API_URL}/${id}/archive`, {
      method: 'PATCH',
      headers: getCmsAuthHeaders(),
    })
    if (!response.ok) throw new Error('Failed to archive service')
    return response.json()
  },
}

export const settingsService = {
  getAllSettings: async (): Promise<CmsSettings> => {
    try {
      return await api.get('/api/settings', { requiresAuth: false })
    } catch (error) {
      console.error('Error fetching settings:', error)
      return {}
    }
  },

  updateSettings: async (settings: CmsSettings): Promise<CmsSettings> =>
    api.post('/api/settings', settings),

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const response: SettingsImageUploadResponse = await api.post('/api/settings/upload', formData, {
      headers: {},
    })
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    return `${baseUrl}${response.url}`
  },
}
