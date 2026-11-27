export interface Announcement {
  id: number
  title: string
  content: string
  category?: string
  excerpt?: string
  date?: string
  createdAt?: string
  imageUrl?: string
  image?: string
  additionalImages?: string[]
  paragraphs?: string[]
  published?: boolean
  isPublished?: boolean
  author?: string
}

export type EventCategory = string

export interface Event {
  id: number
  title: string
  startDate: string
  endDate?: string
  eventDate?: string
  durationDays?: number
  time: string
  location: string
  description: string
  category: EventCategory
  expectedAttendees?: number
  registeredCount?: number
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | string
  organizer?: string
  contactPerson?: string
  contactNumber?: string
  requirements?: string
  targetAudience?: string
  isFeatured?: boolean
  createdByUsername?: string
  updatedByUsername?: string
  createdAt?: string
  updatedAt?: string
}

export interface EventStatsResponse {
  upcomingEvents: number
  thisMonthEvents: number
  expectedAttendeesTotal: number
  nextEventTitle: string
  nextEventDate: string
  totalRegisteredAttendees?: number
  activeDepartmentsCount?: number
}

export type EventCreateRequest = Partial<Omit<Event, 'id'>>
export type EventUpdateRequest = Partial<Omit<Event, 'id'>>

export interface Official {
  id: number
  name: string
  position: string
  type: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CmsService {
  id: number
  title: string
  type?: string
  iconName?: string
  description: string
  fee?: string
  processingTime?: string
  location?: string
  claimProcess?: string
  requirements?: string | string[]
  steps?: string | string[]
  operatingDays?: string
  operatingHours?: string
  requirementsList?: string[]
  stepsList?: string[]
  isPublished?: boolean
  published?: boolean
}

export interface CmsServicePayload {
  title: string
  type: string
  iconName: string
  description: string
  fee: string
  processingTime: string
  location: string
  claimProcess: string
  requirements: string
  steps: string
  operatingDays: string
  operatingHours: string
}

export type CmsSettings = Record<string, string>

export interface SettingsImageUploadResponse {
  url: string
}
