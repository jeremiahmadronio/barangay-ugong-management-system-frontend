import { useState, useEffect } from 'react'
import { FormModal } from './FormModal'
import { FormSection } from './FormSection'
import { Plus, X } from 'lucide-react'
import type { EventResponse, EventCreateRequest, EventUpdateRequest } from '@/config/api/events/events.types'

interface RegisterEventModalProps {
  open: boolean
  event?: EventResponse | null
  onClose: () => void
  onSubmitSuccess: () => void
  onCreate: (data: EventCreateRequest) => Promise<void>
  onUpdate: (id: number, data: EventUpdateRequest) => Promise<void>
}

const CATEGORY_OPTIONS = [
  { label: 'Community', value: 'Community' },
  { label: 'Health', value: 'Health' },
  { label: 'Youth', value: 'Youth' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Senior Citizens', value: 'Senior Citizens' },
  { label: 'General', value: 'General' },
]

const AUDIENCE_OPTIONS = [
  { label: 'All Residents', value: 'All Residents' },
  { label: 'Senior Citizens (60+)', value: 'Senior Citizens' },
  { label: 'Youth (15 - 30)', value: 'Youth' },
  { label: 'Women & Children', value: 'Women & Children' },
  { label: 'Indigent Families', value: 'Indigent Families' },
]

const DEPARTMENT_OPTIONS = [
  { label: 'Office of the Barangay Captain', value: 'Office of the Barangay Captain' },
  { label: 'Health Committee - Senior Citizens', value: 'Health Committee - Senior Citizens' },
  { label: 'Sangguniang Kabataan (SK)', value: 'Sangguniang Kabataan' },
  { label: 'Lupong Tagapamayapa', value: 'Lupong Tagapamayapa' },
  { label: 'VAWC Desk', value: 'VAWC Desk' },
  { label: 'BCPC Desk', value: 'BCPC Desk' },
  { label: 'Livelihood & Gender Committee', value: 'Livelihood & Gender Committee' },
  { label: 'Sports & Recreation Committee', value: 'Sports & Recreation Committee' },
]

const TITLE_PRESETS = [
  'General Barangay Assembly Meeting',
  'Senior Citizens Health Screening & Checkup',
  'Youth Sports & Inter-Sitio Basketball Tournament',
  'Livelihood & Skills Training Workshop',
  'Barangay Cleanup Drive & Recycling Campaign',
  'Free Anti-Rabies Vaccination Drive',
  'VAWC & BCPC Youth Awareness Seminar',
  'Other',
]

const LOCATION_PRESETS = [
  'Barangay Health Center',
  'Barangay Covered Court',
  'Barangay Multipurpose Hall',
  'Ugong Elementary School Gymnasium',
  'Barangay Session Hall',
  'Barangay Daycare Center',
  'Other',
]

function format12HourTime(timeStr: string): string {
  if (!timeStr) return ''
  const [hStr, mStr] = timeStr.split(':')
  let hour = parseInt(hStr, 10)
  if (isNaN(hour)) return timeStr
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${hour}:${mStr || '00'} ${ampm}`
}

function parseTimeRange(timeRangeStr?: string): { start: string; end: string } {
  if (!timeRangeStr) return { start: '08:00', end: '12:00' }
  const parts = timeRangeStr.split('-').map((s) => s.trim())
  if (parts.length < 2) return { start: '08:00', end: '12:00' }

  const parseSingle = (s: string) => {
    const isPM = s.toUpperCase().includes('PM')
    const clean = s.replace(/AM|PM/gi, '').trim()
    const [hStr, mStr] = clean.split(':')
    let h = parseInt(hStr, 10)
    if (isNaN(h)) return '08:00'
    if (isPM && h < 12) h += 12
    if (!isPM && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${mStr || '00'}`
  }

  return {
    start: parseSingle(parts[0]),
    end: parseSingle(parts[1]),
  }
}

function computeAutoStatus(eventDateStr?: string, durationDaysVal: number = 1): string {
  if (!eventDateStr) return 'Upcoming'

  const datePart = eventDateStr.split('T')[0]
  if (!datePart) return 'Upcoming'

  const [yearStr, monthStr, dayStr] = datePart.split('-')
  const eventYear = parseInt(yearStr, 10)
  const eventMonth = parseInt(monthStr, 10) - 1 // 0-indexed month
  const eventDay = parseInt(dayStr, 10)

  if (isNaN(eventYear) || isNaN(eventMonth) || isNaN(eventDay)) return 'Upcoming'

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  const eventStartDay = new Date(eventYear, eventMonth, eventDay).getTime()
  const durationMs = (durationDaysVal || 1) * 24 * 60 * 60 * 1000
  const eventEndDay = eventStartDay + durationMs

  if (todayStart < eventStartDay) {
    return 'Upcoming'
  } else if (todayStart >= eventEndDay) {
    return 'Completed'
  } else {
    return 'Ongoing'
  }
}

export function RegisterEventModal({
  open,
  event,
  onClose,
  onSubmitSuccess,
  onCreate,
  onUpdate,
}: RegisterEventModalProps) {
  const isEditing = Boolean(event)

  // Title preset & custom
  const [titlePreset, setTitlePreset] = useState('General Barangay Assembly Meeting')
  const [customTitle, setCustomTitle] = useState('')

  // Actual Event Execution Date & Duration in Days
  const [eventDate, setEventDate] = useState('')
  const [durationDays, setDurationDays] = useState(1)

  // Web Visibility Publish Dates
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Session hours start/end
  const [sessionStartTime, setSessionStartTime] = useState('08:00')
  const [sessionEndTime, setSessionEndTime] = useState('12:00')

  // Location dropdown & custom text
  const [locationPreset, setLocationPreset] = useState('Barangay Health Center')
  const [customLocation, setCustomLocation] = useState('')

  const [category, setCategory] = useState('Community')
  const [expectedCapacity, setExpectedCapacity] = useState('')
  const [targetAudience, setTargetAudience] = useState('All Residents')
  const [organizer, setOrganizer] = useState('Office of the Barangay Captain')
  const [contactPerson, setContactPerson] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [description, setDescription] = useState('')

  // Document requirement tags
  const [docInput, setDocInput] = useState('')
  const [docList, setDocList] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    if (event) {
      // Parse Title preset or custom
      const t = event.title || ''
      if (TITLE_PRESETS.includes(t)) {
        setTitlePreset(t)
        setCustomTitle('')
      } else {
        setTitlePreset('Other')
        setCustomTitle(t)
      }

      setEventDate(event.eventDate ? event.eventDate.substring(0, 16) : '')
      setDurationDays(event.durationDays ? Number(event.durationDays) : 1)
      setStartDate(event.startDate ? event.startDate.substring(0, 16) : '')
      setEndDate(event.endDate ? event.endDate.substring(0, 16) : '')

      // Parse session hours start & end
      const parsedTime = parseTimeRange(event.time)
      setSessionStartTime(parsedTime.start)
      setSessionEndTime(parsedTime.end)
      
      // Parse location preset or custom
      const loc = event.location || ''
      if (LOCATION_PRESETS.includes(loc)) {
        setLocationPreset(loc)
        setCustomLocation('')
      } else {
        setLocationPreset('Other')
        setCustomLocation(loc)
      }

      setCategory(event.category || 'Community')
      setExpectedCapacity(event.expectedAttendees ? String(event.expectedAttendees) : '')
      setTargetAudience(event.targetAudience || 'All Residents')
      setOrganizer(event.organizer || 'Office of the Barangay Captain')
      setContactPerson(event.contactPerson || '')
      setContactNumber(event.contactNumber || '')
      setDescription(event.description || '')
      if (event.requirements) {
        setDocList(event.requirements.split(',').map((s) => s.trim()).filter(Boolean))
      } else {
        setDocList([])
      }
    } else {
      // Default reset for creation
      const now = new Date()
      const nowFormatted = now.toISOString().substring(0, 16)
      setTitlePreset('General Barangay Assembly Meeting')
      setCustomTitle('')
      setEventDate(nowFormatted)
      setDurationDays(1)
      setStartDate(nowFormatted)
      setEndDate('')
      setSessionStartTime('08:00')
      setSessionEndTime('12:00')
      setLocationPreset('Barangay Health Center')
      setCustomLocation('')
      setCategory('Community')
      setExpectedCapacity('150')
      setTargetAudience('All Residents')
      setOrganizer('Office of the Barangay Captain')
      setContactPerson('')
      setContactNumber('')
      setDescription('')
      setDocList([])
    }
    setDocInput('')
    setErrorMessage(null)
  }, [open, event])

  const handleAddDoc = () => {
    const trimmed = docInput.trim()
    if (trimmed && !docList.includes(trimmed)) {
      setDocList([...docList, trimmed])
      setDocInput('')
    }
  }

  const handleRemoveDoc = (index: number) => {
    setDocList(docList.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const finalTitle = titlePreset === 'Other' ? customTitle.trim() : titlePreset
    if (!finalTitle) {
      setErrorMessage('Please enter or select an event title.')
      return
    }

    if (!eventDate) {
      setErrorMessage('Please select the actual Event Execution Date.')
      return
    }

    const finalLocation = locationPreset === 'Other' ? customLocation.trim() : locationPreset
    if (!finalLocation) {
      setErrorMessage('Please specify an event location.')
      return
    }

    const finalDescription = description.trim() || 'Barangay community program and public activity.'

    setSubmitting(true)
    setErrorMessage(null)

    const requirementsStr = docList.join(', ')
    const formattedTimeLabel = `${format12HourTime(sessionStartTime)} - ${format12HourTime(sessionEndTime)}`

    const formatIso = (str?: string) => {
      if (!str) return undefined
      if (str.length === 16) return `${str}:00`
      return str
    }

    // Automatically compute status based on eventDate and duration
    const autoStatus = computeAutoStatus(eventDate, durationDays)

    try {
      if (isEditing && event) {
        await onUpdate(event.id, {
          title: finalTitle,
          eventDate: formatIso(eventDate),
          durationDays: Number(durationDays),
          startDate: formatIso(startDate || eventDate),
          endDate: formatIso(endDate),
          time: formattedTimeLabel,
          location: finalLocation,
          category,
          status: autoStatus,
          expectedAttendees: expectedCapacity ? Number(expectedCapacity) : 100,
          targetAudience,
          organizer,
          contactPerson,
          contactNumber,
          requirements: requirementsStr,
          description: finalDescription,
        })
      } else {
        await onCreate({
          title: finalTitle,
          eventDate: formatIso(eventDate),
          durationDays: Number(durationDays),
          startDate: formatIso(startDate || eventDate),
          endDate: formatIso(endDate),
          time: formattedTimeLabel,
          location: finalLocation,
          category,
          status: autoStatus,
          expectedAttendees: expectedCapacity ? Number(expectedCapacity) : 100,
          targetAudience,
          organizer,
          contactPerson,
          contactNumber,
          requirements: requirementsStr,
          description: finalDescription,
        })
      }
      onSubmitSuccess()
      onClose()
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save event. Please check inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormModal
      open={open}
      title={isEditing ? 'Edit Event Details' : 'Create New Event'}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      submitLabel={isEditing ? 'Update Event' : 'Save Event'}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Section 1: Event Date & Execution Schedule */}
        <FormSection title="Event Date & Execution Schedule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Title Dropdown with Custom Text Option */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <select
                value={titlePreset}
                onChange={(e) => setTitlePreset(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {TITLE_PRESETS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {titlePreset === 'Other' && (
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Type custom event title..."
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none mt-2"
                />
              )}
            </div>

            {/* Actual Event Execution Date & Duration in Days */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Event Execution Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Event Duration (No. of Days) <span className="text-rose-500">*</span>
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value={1}>1 Day</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days</option>
                <option value={4}>4 Days</option>
                <option value={5}>5 Days</option>
                <option value={7}>1 Week (7 Days)</option>
              </select>
            </div>

            {/* Web Announcement Visibility Dates */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Web Announcement Publish Start <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Web Announcement Publish End <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Session Hours Start & End */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Session Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={sessionStartTime}
                onChange={(e) => setSessionStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Session End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={sessionEndTime}
                onChange={(e) => setSessionEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Location Dropdown with Other Custom Text Option */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={locationPreset}
                onChange={(e) => setLocationPreset(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {LOCATION_PRESETS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {locationPreset === 'Other' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Type specific venue/location name..."
                  className="w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none mt-2"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Audience & Organizer Details */}
        <FormSection title="Audience & Organizer Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expected Capacity <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                value={expectedCapacity}
                onChange={(e) => setExpectedCapacity(e.target.value)}
                placeholder="e.g. 150"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Eligibility / Audience <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Host Committee <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Inquiry Contact Person <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Kagawad Juan"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Inquiry Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 0917-XXX-XXXX"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 3: Requirements & Description */}
        <FormSection title="Requirements & Description">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Required Documents to Bring <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="Type document name, then click Add (e.g. Barangay Clearance)"
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddDoc()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDoc}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  Add
                </button>
              </div>

              {docList.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {docList.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {doc}
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-blue-500 hover:text-blue-700 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description / Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief details about the event..."
                className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}
