import { api } from '../../apiClients';

export type EventCategory = string;

export interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate?: string;
  eventDate?: string;
  durationDays?: number;
  time: string;
  location: string;
  description: string;
  category: EventCategory;
  expectedAttendees?: number;
  registeredCount?: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | string;
  organizer?: string;
  contactPerson?: string;
  contactNumber?: string;
  requirements?: string;
  targetAudience?: string;
  isFeatured?: boolean;
  createdByUsername?: string;
  updatedByUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventStatsResponse {
  upcomingEvents: number;
  thisMonthEvents: number;
  expectedAttendeesTotal: number;
  nextEventTitle: string;
  nextEventDate: string;
  totalRegisteredAttendees?: number;
  activeDepartmentsCount?: number;
}

export type EventCreateRequest = Partial<Omit<Event, 'id'>>;
export type EventUpdateRequest = Partial<Omit<Event, 'id'>>;

export const eventService = {
  getEvents: async (): Promise<Event[]> => {
    return api.get('/api/v1/web-browsing/public/events', { requiresAuth: false });
  },

  getAdminEvents: async (): Promise<Event[]> => {
    return api.get('/api/v1/events/table', { requiresAuth: true }).catch(() => {
      return api.get('/api/v1/web-browsing/events', { requiresAuth: true });
    });
  },

  getEventStats: async (): Promise<EventStatsResponse> => {
    return api.get('/api/v1/events/stats', { requiresAuth: true });
  },

  getEventsTable: async (params?: { search?: string; category?: string; status?: string }): Promise<Event[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.category) query.append("category", params.category);
    if (params?.status) query.append("status", params.status);
    return api.get(`/api/v1/events/table?${query.toString()}`, { requiresAuth: true });
  },

  getEventById: async (id: number): Promise<Event> => {
    return api.get(`/api/v1/events/${id}`, { requiresAuth: true });
  },

  createEvent: async (eventData: EventCreateRequest): Promise<Event> => {
    return api.post('/api/v1/events', eventData, {
      requiresAuth: true,
      offlineDescription: `Create Event: ${eventData.title}`
    }).catch(() => {
      return api.post('/api/v1/web-browsing/events', eventData, {
        requiresAuth: true,
        offlineDescription: `Create Event: ${eventData.title}`
      });
    });
  },

  updateEvent: async (id: number, eventData: EventUpdateRequest): Promise<Event> => {
    return api.put(`/api/v1/events/${id}`, eventData, {
      requiresAuth: true,
      offlineDescription: `Update Event: ${eventData.title}`
    }).catch(() => {
      return api.put(`/api/v1/web-browsing/events/${id}`, eventData, {
        requiresAuth: true,
        offlineDescription: `Update Event: ${eventData.title}`
      });
    });
  },

  updateEventStatus: async (id: number, status: string): Promise<Event> => {
    return api.patch(`/api/v1/events/${id}/status`, { status }, {
      requiresAuth: true,
      offlineDescription: `Update Event Status: ${status}`
    });
  },

  deleteEvent: async (id: number): Promise<void> => {
    return api.delete(`/api/v1/events/${id}`, {
      requiresAuth: true,
      offlineDescription: `Delete Event ID: ${id}`
    }).catch(() => {
      return api.delete(`/api/v1/web-browsing/events/${id}`, {
        requiresAuth: true,
        offlineDescription: `Delete Event ID: ${id}`
      });
    });
  }
};
