import { axiosInstance } from '../axios.config'
import type {
  EventStatsResponse,
  EventResponse,
  EventCreateRequest,
  EventUpdateRequest,
} from './events.types'

export const eventsService = {
  /** Fetch Event Management Summary Statistics */
  async getEventStats(): Promise<EventStatsResponse> {
    const response = await axiosInstance.get<EventStatsResponse>('/api/v1/events/stats')
    return response.data
  },

  /** Fetch Events list with search, category, and status filtering */
  async getEventsTable(params?: {
    search?: string
    category?: string
    status?: string
  }): Promise<EventResponse[]> {
    const response = await axiosInstance.get<EventResponse[]>('/api/v1/events/table', {
      params,
    })
    return response.data
  },

  /** Fetch single Event by ID */
  async getEventById(id: number): Promise<EventResponse> {
    const response = await axiosInstance.get<EventResponse>(`/api/v1/events/${id}`)
    return response.data
  },

  /** Create a new Event */
  async createEvent(data: EventCreateRequest): Promise<EventResponse> {
    const response = await axiosInstance.post<EventResponse>('/api/v1/events', data)
    return response.data
  },

  /** Update an existing Event */
  async updateEvent(id: number, data: EventUpdateRequest): Promise<EventResponse> {
    const response = await axiosInstance.put<EventResponse>(`/api/v1/events/${id}`, data)
    return response.data
  },

  /** Update Event Status */
  async updateEventStatus(id: number, status: string): Promise<EventResponse> {
    const response = await axiosInstance.patch<EventResponse>(`/api/v1/events/${id}/status`, {
      status,
    })
    return response.data
  },

  /** Delete an Event */
  async deleteEvent(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/events/${id}`)
  },
}
