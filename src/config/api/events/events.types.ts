export interface EventStatsResponse {
  upcomingEvents: number
  thisMonthEvents: number
  expectedAttendeesTotal: number
  nextEventTitle: string
  nextEventDate: string
  totalRegisteredAttendees: number
  activeDepartmentsCount: number
}

export interface EventResponse {
  id: number
  title: string
  startDate?: string
  endDate?: string
  eventDate?: string
  durationDays?: number
  time: string
  location: string
  description: string
  category: string
  expectedAttendees: number
  registeredCount: number
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | string
  organizer?: string
  contactPerson?: string
  contactNumber?: string
  requirements?: string
  targetAudience?: string
  isFeatured?: boolean
  createdAt?: string
}

export interface EventCreateRequest {
  title: string
  startDate?: string
  endDate?: string
  eventDate?: string
  durationDays?: number
  time?: string
  location: string
  description: string
  category: string
  expectedAttendees?: number
  status?: string
  organizer?: string
  contactPerson?: string
  contactNumber?: string
  requirements?: string
  targetAudience?: string
  isFeatured?: boolean
}

export interface EventUpdateRequest {
  title?: string
  startDate?: string
  endDate?: string
  eventDate?: string
  durationDays?: number
  time?: string
  location?: string
  description?: string
  category?: string
  expectedAttendees?: number
  status?: string
  organizer?: string
  contactPerson?: string
  contactNumber?: string
  requirements?: string
  targetAudience?: string
  isFeatured?: boolean
}
