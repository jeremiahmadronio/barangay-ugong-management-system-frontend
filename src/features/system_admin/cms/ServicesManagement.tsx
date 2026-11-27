import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  FileText,
  Activity,
  Shield,
  Users,
  Briefcase,
  Heart,
  BookOpen,
  Truck,
  Monitor,
  Map,
  Pencil,
  Trash2,
} from 'lucide-react'
import { serviceApi } from '@/config/api/cms/serviceApi'
import {
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  FormModal,
  FormSection,
  LoadingState,
} from '@/components/ui'
import {
  DataTable,
  TableFilters,
  Badge,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'

// Mapping of available icons for the admin to choose from
const iconMap: Record<string, React.FC<any>> = {
  FileText,
  Activity,
  Shield,
  Users,
  Briefcase,
  Heart,
  BookOpen,
  Truck,
  Monitor,
  Map,
}

const iconUsageMap: Record<string, string> = {
  FileText: 'Documents & Forms',
  Activity: 'Health & Medical',
  Shield: 'Security & Clearances',
  Users: 'Community & Groups',
  Briefcase: 'Business & Employment',
  Heart: 'Welfare & Support',
  BookOpen: 'Education & Programs',
  Truck: 'Transport & Delivery',
  Monitor: 'Online & Digital Services',
  Map: 'Location & Zoning',
}

const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Mon', full: 'Monday' },
  { key: 'Tue', label: 'Tue', full: 'Tuesday' },
  { key: 'Wed', label: 'Wed', full: 'Wednesday' },
  { key: 'Thu', label: 'Thu', full: 'Thursday' },
  { key: 'Fri', label: 'Fri', full: 'Friday' },
  { key: 'Sat', label: 'Sat', full: 'Saturday' },
  { key: 'Sun', label: 'Sun', full: 'Sunday' },
]

const formatSelectedDays = (days: string[]): string => {
  if (!days || days.length === 0) return ''
  if (days.length === 7) return 'Monday to Sunday'

  const isWeekdays = days.length === 5 && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every((d) => days.includes(d))
  if (isWeekdays) return 'Monday to Friday'

  const isMonToSat = days.length === 6 && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].every((d) => days.includes(d))
  if (isMonToSat) return 'Monday to Saturday'

  const isWeekends = days.length === 2 && days.includes('Sat') && days.includes('Sun')
  if (isWeekends) return 'Saturday to Sunday'

  const fullNames = days.map((d) => DAYS_OF_WEEK.find((item) => item.key === d)?.full || d)
  return fullNames.join(', ')
}

const format12Hour = (time24: string): string => {
  if (!time24) return ''
  const [hStr, mStr] = time24.split(':')
  let hour = parseInt(hStr, 10)
  const minute = mStr || '00'
  if (isNaN(hour)) return ''
  if (hour === 12 && minute === '00') return '12:00 NN'
  if (hour === 0 && minute === '00') return '12:00 MN'
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${hour}:${minute} ${ampm}`
}

const parseOperatingDays = (val: string): { days: string[]; isCustom: boolean } => {
  if (!val || !val.trim()) return { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isCustom: false }
  const lower = val.toLowerCase().trim()
  if (lower.includes('everyday') || lower.includes('daily') || (lower.includes('mon') && lower.includes('sun'))) {
    return { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], isCustom: false }
  }
  if (lower.includes('weekend') || (lower.includes('sat') && lower.includes('sun') && !lower.includes('mon'))) {
    return { days: ['Sat', 'Sun'], isCustom: false }
  }
  if (lower.includes('mon') && lower.includes('sat')) {
    return { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isCustom: false }
  }
  if (lower.includes('mon') && lower.includes('fri')) {
    return { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isCustom: false }
  }
  const found: string[] = []
  DAYS_OF_WEEK.forEach(({ key, full }) => {
    if (lower.includes(key.toLowerCase()) || lower.includes(full.toLowerCase())) {
      found.push(key)
    }
  })
  if (found.length > 0) {
    return { days: DAYS_OF_WEEK.map((d) => d.key).filter((k) => found.includes(k)), isCustom: false }
  }
  return { days: [], isCustom: true }
}

const parseOperatingHours = (
  val: string
): { startTime: string; endTime: string; is24h: boolean; isCustom: boolean } => {
  if (!val || !val.trim()) {
    return { startTime: '08:00', endTime: '17:00', is24h: false, isCustom: false }
  }
  const lower = val.toLowerCase().trim()
  if (lower.includes('24') || lower.includes('round the clock')) {
    return { startTime: '', endTime: '', is24h: true, isCustom: false }
  }
  const regex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|nn|mn)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|nn|mn)?/i
  const match = val.match(regex)
  if (match) {
    const to24 = (h: string, m: string | undefined, ampm: string | undefined) => {
      let hour = parseInt(h, 10)
      const minute = m ? m.padStart(2, '0') : '00'
      const p = ampm ? ampm.toLowerCase() : ''
      if (p === 'nn') return `12:${minute}`
      if (p === 'mn') return `00:${minute}`
      if (p === 'pm' && hour < 12) hour += 12
      if (p === 'am' && hour === 12) hour = 0
      return `${String(hour).padStart(2, '0')}:${minute}`
    }
    const start = to24(match[1], match[2], match[3])
    const end = to24(match[4], match[5], match[6])
    return { startTime: start, endTime: end, is24h: false, isCustom: false }
  }
  return { startTime: '', endTime: '', is24h: false, isCustom: true }
}

const FEE_PRESETS = [
  { label: 'Free (Libre)', value: 'Free' },
  { label: '₱30.00', value: '₱30.00' },
  { label: '₱50.00', value: '₱50.00' },
  { label: '₱100.00', value: '₱100.00' },
  { label: '₱150.00', value: '₱150.00' },
  { label: '₱200.00', value: '₱200.00' },
]

const parseFeeValue = (val: string): { amount: string; isFree: boolean; isCustom: boolean } => {
  if (!val || !val.trim()) return { amount: '50.00', isFree: false, isCustom: false }
  const lower = val.toLowerCase().trim()
  if (lower === 'free' || lower.includes('libre') || lower === '0' || lower === '₱0' || lower === '₱0.00') {
    return { amount: '', isFree: true, isCustom: false }
  }
  const cleanNum = val.replace(/[^0-9.]/g, '')
  if (cleanNum && !isNaN(Number(cleanNum)) && (val.startsWith('₱') || !isNaN(Number(val)))) {
    const num = parseFloat(cleanNum)
    return { amount: num.toFixed(2), isFree: false, isCustom: false }
  }
  return { amount: '', isFree: false, isCustom: true }
}

const PROCESSING_TIME_PRESETS = [
  { label: '15 – 30 Minutes', value: '15 to 30 minutes' },
  { label: 'Same Day (1 – 2 Hours)', value: '1 to 2 hours' },
  { label: '1 – 2 Working Days', value: '1 to 2 working days' },
  { label: '3 – 5 Working Days', value: '3 to 5 working days' },
  { label: 'Immediate / Walk-in', value: 'Immediate release upon request' },
]

const LOCATION_SUGGESTIONS = [
  'Window 1 (Clearance)',
  'Window 2 (Treasury)',
  'Barangay Secretary Office',
  'Barangay Hall Main Desk',
]

const CLAIMING_SUGGESTIONS = [
  'Present Claim Stub & Valid ID',
  'Personal Appearance & Valid ID',
  'Same-day release upon payment',
  'Release via Authorized Representative',
]

const parseProcessingTime = (
  val: string
): { num1: string; num2: string; unit: string; isCustom: boolean } => {
  if (!val || !val.trim()) return { num1: '15', num2: '30', unit: 'minutes', isCustom: false }
  const lower = val.toLowerCase().trim()

  const rangeMatch = lower.match(/^(\d+)\s*(?:to|-)\s*(\d+)\s*(minute|minutes|hour|hours|working day|working days|day|days|week|weeks)/i)
  if (rangeMatch) {
    let unit = rangeMatch[3].toLowerCase()
    if (unit.includes('min')) unit = 'minutes'
    else if (unit.includes('hour')) unit = 'hours'
    else if (unit.includes('work') || unit.includes('day')) unit = 'working days'
    else if (unit.includes('week')) unit = 'weeks'
    return { num1: rangeMatch[1], num2: rangeMatch[2], unit, isCustom: false }
  }

  const singleMatch = lower.match(/^(\d+)\s*(minute|minutes|hour|hours|working day|working days|day|days|week|weeks)/i)
  if (singleMatch) {
    let unit = singleMatch[2].toLowerCase()
    if (unit.includes('min')) unit = 'minutes'
    else if (unit.includes('hour')) unit = 'hours'
    else if (unit.includes('work') || unit.includes('day')) unit = 'working days'
    else if (unit.includes('week')) unit = 'weeks'
    return { num1: singleMatch[1], num2: '', unit, isCustom: false }
  }

  return { num1: '', num2: '', unit: 'minutes', isCustom: true }
}

export default function ServicesManagement() {
  const LIMITS = {
    title: { min: 3, max: 80 },
    description: { min: 10, max: 500 },
    fee: { max: 50 },
    processingTime: { max: 50 },
    location: { max: 100 },
    claimProcess: { max: 200 },
    operatingDays: { max: 60 },
    operatingHours: { max: 60 },
    requirements: { max: 1500 },
    steps: { max: 1500 },
  }

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  const [formData, setFormData] = useState({
    title: '',
    type: 'DOCUMENT',
    iconName: 'FileText',
    description: '',
    fee: '',
    processingTime: '',
    location: '',
    claimProcess: '',
    requirements: '',
    steps: '',
    operatingDays: '',
    operatingHours: '',
  })

  const [initialFormData, setInitialFormData] = useState({
    title: '',
    type: 'DOCUMENT',
    iconName: 'FileText',
    description: '',
    fee: '',
    processingTime: '',
    location: '',
    claimProcess: '',
    requirements: '',
    steps: '',
    operatingDays: '',
    operatingHours: '',
  })

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Operating Days & Hours builder state
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [customDaysMode, setCustomDaysMode] = useState(false)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')
  const [is24Hours, setIs24Hours] = useState(false)
  const [customHoursMode, setCustomHoursMode] = useState(false)

  // Fee builder state
  const [feeAmount, setFeeAmount] = useState('50.00')
  const [isFeeFree, setIsFeeFree] = useState(false)
  const [customFeeMode, setCustomFeeMode] = useState(false)

  // Processing Time builder state
  const [procNum1, setProcNum1] = useState('15')
  const [procNum2, setProcNum2] = useState('30')
  const [procUnit, setProcUnit] = useState('minutes')
  const [customProcMode, setCustomProcMode] = useState(false)

  const handleApplyFeePreset = (value: string) => {
    setCustomFeeMode(false)
    if (value === 'Free') {
      setIsFeeFree(true)
      setFeeAmount('')
      handleFieldChange('fee', 'Free')
    } else {
      setIsFeeFree(false)
      const clean = value.replace(/[^0-9.]/g, '')
      setFeeAmount(clean)
      handleFieldChange('fee', value)
    }
  }

  const handleFeeAmountChange = (amt: string) => {
    setFeeAmount(amt)
    setIsFeeFree(false)
    if (amt.trim() === '' || isNaN(Number(amt))) {
      handleFieldChange('fee', amt)
    } else {
      const num = parseFloat(amt)
      handleFieldChange('fee', `₱${num.toFixed(2)}`)
    }
  }

  const handleApplyProcPreset = (value: string) => {
    setCustomProcMode(false)
    const parsed = parseProcessingTime(value)
    if (!parsed.isCustom) {
      setProcNum1(parsed.num1)
      setProcNum2(parsed.num2)
      setProcUnit(parsed.unit)
    }
    handleFieldChange('processingTime', value)
  }

  const handleProcDurationChange = (n1: string, n2: string, unit: string) => {
    setProcNum1(n1)
    setProcNum2(n2)
    setProcUnit(unit)
    if (!n1.trim()) {
      handleFieldChange('processingTime', '')
      return
    }
    const formatted = n2.trim()
      ? `${n1.trim()} to ${n2.trim()} ${unit}`
      : `${n1.trim()} ${unit}`
    handleFieldChange('processingTime', formatted)
  }

  const handleToggleDay = (dayKey: string) => {
    const updated = selectedDays.includes(dayKey)
      ? selectedDays.filter((d) => d !== dayKey)
      : [...selectedDays, dayKey]
    const sorted = DAYS_OF_WEEK.map((d) => d.key).filter((k) => updated.includes(k))
    setSelectedDays(sorted)
    const formatted = formatSelectedDays(sorted)
    handleFieldChange('operatingDays', formatted)
  }

  const handleApplyDaysPreset = (days: string[]) => {
    setSelectedDays(days)
    setCustomDaysMode(false)
    const formatted = formatSelectedDays(days)
    handleFieldChange('operatingDays', formatted)
  }

  const handleTimeChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart)
    setEndTime(newEnd)
    setIs24Hours(false)
    if (newStart && newEnd) {
      const formatted = `${format12Hour(newStart)} - ${format12Hour(newEnd)}`
      handleFieldChange('operatingHours', formatted)
    } else if (newStart) {
      handleFieldChange('operatingHours', `From ${format12Hour(newStart)}`)
    }
  }

  const handleToggle24Hours = () => {
    const next = !is24Hours
    setIs24Hours(next)
    if (next) {
      handleFieldChange('operatingHours', '24 Hours (Open 24/7)')
    } else {
      const formatted = startTime && endTime ? `${format12Hour(startTime)} - ${format12Hour(endTime)}` : '8:00 AM - 5:00 PM'
      handleFieldChange('operatingHours', formatted)
    }
  }

  const handleApplyHoursPreset = (start: string, end: string, label?: string) => {
    setIs24Hours(false)
    setCustomHoursMode(false)
    setStartTime(start)
    setEndTime(end)
    const formatted = label || `${format12Hour(start)} - ${format12Hour(end)}`
    handleFieldChange('operatingHours', formatted)
  }

  // TableFilters state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    type: 'all',
  })

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Search',
        placeholder: 'Search service title or description...',
      },
      {
        key: 'type',
        label: 'Service Type',
        options: [
          { label: 'All Service Types', value: 'all' },
          { label: 'Document Request', value: 'DOCUMENT' },
          { label: 'Community Service', value: 'SERVICE' },
        ],
      },
    ],
    []
  )

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'title': {
        const trimmed = value.trim()
        if (!trimmed) return 'Service title is required.'
        if (trimmed.length < LIMITS.title.min) return `Title must be at least ${LIMITS.title.min} characters.`
        if (value.length > LIMITS.title.max) return `Title must not exceed ${LIMITS.title.max} characters.`
        return ''
      }
      case 'description': {
        const trimmed = value.trim()
        if (!trimmed) return 'Service description is required.'
        if (trimmed.length < LIMITS.description.min) return `Description must be at least ${LIMITS.description.min} characters.`
        if (value.length > LIMITS.description.max) return `Description must not exceed ${LIMITS.description.max} characters.`
        return ''
      }
      case 'fee': {
        if (value.length > LIMITS.fee.max) return `Fee must not exceed ${LIMITS.fee.max} characters.`
        return ''
      }
      case 'processingTime': {
        if (value.length > LIMITS.processingTime.max) return `Processing time must not exceed ${LIMITS.processingTime.max} characters.`
        return ''
      }
      case 'location': {
        if (value.length > LIMITS.location.max) return `Location must not exceed ${LIMITS.location.max} characters.`
        return ''
      }
      case 'claimProcess': {
        if (value.length > LIMITS.claimProcess.max) return `Claiming process must not exceed ${LIMITS.claimProcess.max} characters.`
        return ''
      }
      case 'operatingDays': {
        if (value.length > LIMITS.operatingDays.max) return `Operating days must not exceed ${LIMITS.operatingDays.max} characters.`
        return ''
      }
      case 'operatingHours': {
        if (value.length > LIMITS.operatingHours.max) return `Operating hours must not exceed ${LIMITS.operatingHours.max} characters.`
        return ''
      }
      case 'requirements': {
        if (value.length > LIMITS.requirements.max) return `Requirements text exceeds maximum of ${LIMITS.requirements.max} characters.`
        return ''
      }
      case 'steps': {
        if (value.length > LIMITS.steps.max) return `Steps text exceeds maximum of ${LIMITS.steps.max} characters.`
        return ''
      }
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value),
    }))
  }

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      title: validateField('title', formData.title),
      description: validateField('description', formData.description),
      fee: formData.type === 'DOCUMENT' ? validateField('fee', formData.fee) : '',
      processingTime: formData.type === 'DOCUMENT' ? validateField('processingTime', formData.processingTime) : '',
      location: formData.type === 'DOCUMENT' ? validateField('location', formData.location) : '',
      claimProcess: formData.type === 'DOCUMENT' ? validateField('claimProcess', formData.claimProcess) : '',
      operatingDays: formData.type === 'SERVICE' ? validateField('operatingDays', formData.operatingDays) : '',
      operatingHours: formData.type === 'SERVICE' ? validateField('operatingHours', formData.operatingHours) : '',
      requirements: validateField('requirements', formData.requirements),
      steps: validateField('steps', formData.steps),
    }

    setErrors(newErrors)
    setTouched({
      title: true,
      description: true,
      fee: true,
      processingTime: true,
      location: true,
      claimProcess: true,
      operatingDays: true,
      operatingHours: true,
      requirements: true,
      steps: true,
    })

    return !Object.values(newErrors).some((err) => Boolean(err))
  }

  const fetchServices = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await serviceApi.getAllServices()
      setServices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch services', error)
      showFeedback({
        variant: 'error',
        title: 'Fetch Error',
        description: 'Failed to retrieve services list from server.',
      })
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const filteredServices = useMemo(() => {
    return services.filter((row) => {
      if (filterValues.search?.trim()) {
        const q = filterValues.search.trim().toLowerCase()
        const matchesTitle = row.title?.toLowerCase().includes(q)
        const matchesDesc = row.description?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesDesc) return false
      }
      if (filterValues.type && filterValues.type !== 'all') {
        if (row.type !== filterValues.type) return false
      }
      return true
    })
  }, [services, filterValues])

  const parseStringArray = (val: string) => {
    if (!val) return ''
    try {
      const parsed = JSON.parse(val)
      if (Array.isArray(parsed)) return parsed.join('\n')
      return val
    } catch {
      return val
    }
  }

  const checkHasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData)
  }

  const handleOpenNew = () => {
    const emptyForm = {
      title: '',
      type: 'DOCUMENT',
      iconName: 'FileText',
      description: '',
      fee: '₱50.00',
      processingTime: '15 to 30 minutes',
      location: 'Window 1, Barangay Hall',
      claimProcess: 'Present Claim Stub & Valid ID',
      requirements: '',
      steps: '',
      operatingDays: 'Monday to Friday',
      operatingHours: '8:00 AM - 5:00 PM',
    }
    setFeeAmount('50.00')
    setIsFeeFree(false)
    setCustomFeeMode(false)
    setProcNum1('15')
    setProcNum2('30')
    setProcUnit('minutes')
    setCustomProcMode(false)
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    setCustomDaysMode(false)
    setStartTime('08:00')
    setEndTime('17:00')
    setIs24Hours(false)
    setCustomHoursMode(false)
    setFormData(emptyForm)
    setInitialFormData(emptyForm)
    setErrors({})
    setTouched({})
    setEditingId(null)
    setOpenModal(true)
  }

  const handleOpenEdit = (service: any) => {
    const rawFee = service.fee || ''
    const parsedFee = parseFeeValue(rawFee)
    setFeeAmount(parsedFee.amount)
    setIsFeeFree(parsedFee.isFree)
    setCustomFeeMode(parsedFee.isCustom)

    const rawProc = service.processingTime || ''
    const parsedProc = parseProcessingTime(rawProc)
    setProcNum1(parsedProc.num1)
    setProcNum2(parsedProc.num2)
    setProcUnit(parsedProc.unit)
    setCustomProcMode(parsedProc.isCustom)

    const rawDays = service.operatingDays || ''
    const parsedDays = parseOperatingDays(rawDays)
    setSelectedDays(parsedDays.days)
    setCustomDaysMode(parsedDays.isCustom)

    const rawHours = service.operatingHours || ''
    const parsedHours = parseOperatingHours(rawHours)
    setStartTime(parsedHours.startTime)
    setEndTime(parsedHours.endTime)
    setIs24Hours(parsedHours.is24h)
    setCustomHoursMode(parsedHours.isCustom)

    const editForm = {
      title: service.title || '',
      type: service.type || 'DOCUMENT',
      iconName: service.iconName || 'FileText',
      description: service.description || '',
      fee: rawFee,
      processingTime: rawProc,
      location: service.location || '',
      claimProcess: service.claimProcess || '',
      requirements: parseStringArray(service.requirements),
      steps: parseStringArray(service.steps),
      operatingDays: rawDays,
      operatingHours: rawHours,
    }
    setFormData(editForm)
    setInitialFormData(editForm)
    setErrors({})
    setTouched({})
    setEditingId(service.id)
    setOpenModal(true)
  }

  const preparePayload = () => {
    return {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      fee: formData.fee.trim(),
      processingTime: formData.processingTime.trim(),
      location: formData.location.trim(),
      claimProcess: formData.claimProcess.trim(),
      operatingDays: formData.operatingDays.trim(),
      operatingHours: formData.operatingHours.trim(),
      requirements: JSON.stringify(
        formData.requirements
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s !== '')
      ),
      steps: JSON.stringify(
        formData.steps
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s !== '')
      ),
    }
  }

  const handleCloseModal = () => {
    if (checkHasChanges()) {
      confirm({
        title: 'Discard Changes?',
        description: 'You have unsaved changes in this service. Are you sure you want to discard them?',
        tone: 'warning',
        confirmLabel: 'Discard Changes',
        onConfirm: () => setOpenModal(false),
      })
    } else {
      setOpenModal(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateAll()) {
      showFeedback({
        variant: 'error',
        title: 'Validation Errors',
        description: 'Please fix the highlighted fields before saving.',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const payload = preparePayload()
      if (editingId) {
        await serviceApi.updateService(editingId, payload)
        showFeedback({
          variant: 'success',
          title: 'Service Updated',
          description: `"${formData.title.trim()}" has been updated successfully.`,
        })
      } else {
        await serviceApi.createService(payload)
        showFeedback({
          variant: 'success',
          title: 'Service Created',
          description: `"${formData.title.trim()}" has been created and is now active.`,
        })
      }
      setOpenModal(false)
      fetchServices(false)
    } catch (error) {
      console.error(error)
      showFeedback({
        variant: 'error',
        title: 'Save Failed',
        description: 'Could not save service. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePublish = useCallback(
    async (row: any) => {
      const currentStatus = Boolean(row.isPublished ?? row.published)
      const newStatus = !currentStatus
      setServices((prev) =>
        prev.map((s) => (s.id === row.id ? { ...s, isPublished: newStatus, published: newStatus } : s))
      )

      try {
        await serviceApi.togglePublish(row.id)
        showFeedback({
          variant: 'success',
          title: newStatus ? 'Service Published' : 'Service Unpublished',
          description: `"${row.title}" is now ${newStatus ? 'visible on the public portal' : 'saved as draft'}.`,
        })
      } catch (error) {
        console.error(error)
        setServices((prev) =>
          prev.map((s) => (s.id === row.id ? { ...s, isPublished: currentStatus, published: currentStatus } : s))
        )
        showFeedback({
          variant: 'error',
          title: 'Update Failed',
          description: 'Failed to update service publish status.',
        })
      }
    },
    [showFeedback]
  )

  const handleDelete = (service: any) => {
    confirm({
      title: 'Delete Service?',
      description: `Are you sure you want to permanently delete "${service.title}"? This cannot be undone.`,
      tone: 'danger',
      confirmLabel: 'Delete Permanently',
      onConfirm: async () => {
        try {
          await serviceApi.deleteService(service.id)
          fetchServices(false)
          showFeedback({
            variant: 'success',
            title: 'Service Deleted',
            description: `"${service.title}" has been permanently removed.`,
          })
        } catch (error) {
          console.error(error)
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: 'Could not delete service. Please try again.',
          })
        }
      },
    })
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || FileText
    return <IconComponent className="w-5 h-5" />
  }

  const CharCount = ({ value, max, min }: { value?: string; max: number; min?: number }) => {
    const len = (value || '').length
    const isOver = len > max
    const isUnder = min !== undefined && len > 0 && len < min
    return (
      <span
        className={`text-[11px] font-medium font-mono ${
          isOver ? 'text-rose-500 font-bold' : isUnder ? 'text-amber-500' : 'text-slate-400'
        }`}
      >
        {len}/{max}
      </span>
    )
  }

  const FieldError = ({ field }: { field: string }) => {
    if (!touched[field] || !errors[field]) return null
    return (
      <p className="mt-1 text-xs text-rose-500 font-medium">
        {errors[field]}
      </p>
    )
  }

  const inputClass = (field?: string) => {
    const hasError = field ? touched[field] && Boolean(errors[field]) : false
    return `w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors ${
      hasError
        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
        : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
    }`
  }

  // DataTable columns
  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: 'iconName',
        header: 'ICON',
        render: (row) => (
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            {renderIcon(row.iconName)}
          </div>
        ),
      },
      {
        key: 'title',
        header: 'SERVICE DETAILS',
        render: (row) => (
          <div className="max-w-xs">
            <div className="font-semibold text-slate-900 text-sm uppercase">{row.title}</div>
            <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{row.description}</div>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'TYPE',
        render: (row) => (
          <Badge tone={row.type === 'DOCUMENT' ? 'sky' : 'emerald'}>
            {row.type === 'DOCUMENT' ? 'Document Request' : 'Community Service'}
          </Badge>
        ),
      },
      {
        key: 'fee',
        header: 'FEE',
        render: (row) => (
          <span className="text-sm font-medium text-slate-700">
            {row.fee ? row.fee : <span className="text-emerald-600 font-semibold">Free</span>}
          </span>
        ),
      },
      {
        key: 'processingTime',
        header: 'TIMEFRAME',
        render: (row) => (
          <span className="text-sm text-slate-500">
            {row.processingTime || <span className="text-slate-300">—</span>}
          </span>
        ),
      },
      {
        key: 'isPublished',
        header: 'PUBLISHED',
        align: 'center',
        render: (row) => (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(row.isPublished ?? row.published)}
              onChange={() => handleTogglePublish(row)}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        ),
      },
    ],
    [handleTogglePublish]
  )

  const tableActions: RowAction<any>[] = useMemo(
    () => [
      {
        id: 'edit',
        label: 'Edit Service',
        icon: Pencil,
        tone: 'primary',
        onClick: (row) => handleOpenEdit(row),
      },
      {
        id: 'delete',
        label: 'Delete Service',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDelete(row),
      },
    ],
    [handleOpenEdit, handleDelete]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Management"
        description="Configure barangay clearance issuance, certifications, and public community assistance programs."
        actions={[
          {
            label: 'Add Service',
            icon: Plus,
            onClick: handleOpenNew,
          },
        ]}
      />

      {/* Clean Filters */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={(applied) => setFilterValues(applied)}
        onClear={() => setFilterValues({ search: '', type: 'all' })}
      />

      {/* Data Table */}
      {loading ? (
        <LoadingState message="Loading services..." />
      ) : (
        <DataTable
          data={filteredServices}
          columns={columns}
          rowKey={(row) => row.id}
          actions={tableActions}
          pageSize={7}
          emptyTitle="No services found"
          emptyDescription="No barangay services match your current filters. Adjust your search or add a new service."
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={openModal}
        title={editingId ? 'Edit Service' : 'Add New Service'}
        submitLabel={isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Service'}
        isSubmitting={isSubmitting}
        maxWidthClass="max-w-4xl"
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          <FormSection title="Service Identification">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Service Title <span className="text-rose-500">*</span>
                    </label>
                    <CharCount value={formData.title} max={LIMITS.title.max} min={LIMITS.title.min} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. BARANGAY CLEARANCE"
                    maxLength={LIMITS.title.max}
                    className={`${inputClass('title')} uppercase`}
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                  />
                  <FieldError field="title" />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Service Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={inputClass('type')}
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        type: newType,
                        ...(newType === 'SERVICE'
                          ? { fee: '', processingTime: '', location: '', claimProcess: '' }
                          : { operatingDays: '', operatingHours: '' }),
                      }))
                    }}
                  >
                    <option value="DOCUMENT">Document Request (e.g. Clearances, Permits)</option>
                    <option value="SERVICE">Community Program (e.g. Free Medical, Relief)</option>
                  </select>
                </div>
              </div>

              {/* Visual Icon */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Select Visual Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {Object.keys(iconMap).map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormData({ ...formData, iconName })}
                      title={iconUsageMap[iconName]}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        formData.iconName === iconName
                          ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {renderIcon(iconName)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Short Description <span className="text-rose-500">*</span>
                  </label>
                  <CharCount value={formData.description} max={LIMITS.description.max} min={LIMITS.description.min} />
                </div>
                <textarea
                  rows={2}
                  maxLength={LIMITS.description.max}
                  placeholder="Provide a concise description of who can apply and what this service provides..."
                  className={`${inputClass('description')} resize-none`}
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                />
                <FieldError field="description" />
              </div>
            </div>
          </FormSection>

          {formData.type === 'DOCUMENT' ? (
            <FormSection title="Fees, Timeline & Processing">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Standard Fee Selector */}
                <div className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Standard Fee (PHP)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomFeeMode((prev) => !prev)}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                      >
                        {customFeeMode ? 'Use Fee Presets' : 'Type Custom'}
                      </button>
                      <CharCount value={formData.fee} max={LIMITS.fee.max} />
                    </div>
                  </div>

                  {!customFeeMode ? (
                    <div className="space-y-3">
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {FEE_PRESETS.map((preset) => {
                          const isSelected =
                            (preset.value === 'Free' && isFeeFree) ||
                            (!isFeeFree && formData.fee === preset.value)
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleApplyFeePreset(preset.value)}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Custom Numeric / Free Toggle */}
                      {!isFeeFree ? (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">
                            Or Enter Specific Amount (PHP):
                          </label>
                          <div className="relative rounded-lg shadow-2xs">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-slate-500 text-sm font-bold">₱</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={feeAmount}
                              onChange={(e) => handleFeeAmountChange(e.target.value)}
                              placeholder="50.00"
                              className="w-full text-xs font-semibold pl-7 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium text-center">
                          Service is Free of Charge (Libre / Walang Bayad)
                        </div>
                      )}

                      {/* Output Preview */}
                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Summary:</span>
                        <span className="font-semibold text-slate-800">
                          {formData.fee || <span className="text-slate-400 italic">None specified</span>}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={LIMITS.fee.max}
                        placeholder="e.g. ₱50.00 or Free for Seniors"
                        className={inputClass('fee')}
                        value={formData.fee}
                        onChange={(e) => handleFieldChange('fee', e.target.value)}
                      />
                      <p className="text-[11px] text-slate-500">
                        Type custom fee notes. Click "Use Fee Presets" above to switch back.
                      </p>
                    </div>
                  )}
                  <FieldError field="fee" />
                </div>

                {/* Processing Time Selector */}
                <div className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Processing Time
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomProcMode((prev) => !prev)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {customProcMode ? 'Use Time Presets' : 'Type Custom'}
                      </button>
                      <CharCount value={formData.processingTime} max={LIMITS.processingTime.max} />
                    </div>
                  </div>

                  {!customProcMode ? (
                    <div className="space-y-3">
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {PROCESSING_TIME_PRESETS.map((preset) => {
                          const isSelected = formData.processingTime === preset.value
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleApplyProcPreset(preset.value)}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          )
                        })}
                      </div>

                      {/* Duration builder (From - To - Unit) */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Or Set Duration Range:
                        </label>
                        <div className="grid grid-cols-5 gap-1.5 items-center">
                          <input
                            type="number"
                            min="1"
                            value={procNum1}
                            onChange={(e) => handleProcDurationChange(e.target.value, procNum2, procUnit)}
                            placeholder="15"
                            className="col-span-1 text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <span className="text-[11px] text-slate-400 text-center font-bold">to</span>
                          <input
                            type="number"
                            min="1"
                            value={procNum2}
                            onChange={(e) => handleProcDurationChange(procNum1, e.target.value, procUnit)}
                            placeholder="30"
                            className="col-span-1 text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <select
                            value={procUnit}
                            onChange={(e) => handleProcDurationChange(procNum1, procNum2, e.target.value)}
                            className="col-span-2 text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="working days">Working Days</option>
                            <option value="weeks">Weeks</option>
                          </select>
                        </div>
                      </div>

                      {/* Output Preview */}
                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Summary:</span>
                        <span className="font-semibold text-slate-800">
                          {formData.processingTime || <span className="text-slate-400 italic">None specified</span>}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={LIMITS.processingTime.max}
                        placeholder="e.g. 15 to 30 minutes"
                        className={inputClass('processingTime')}
                        value={formData.processingTime}
                        onChange={(e) => handleFieldChange('processingTime', e.target.value)}
                      />
                      <p className="text-[11px] text-slate-500">
                        Type custom processing time phrasing. Click "Use Time Presets" above to switch back.
                      </p>
                    </div>
                  )}
                  <FieldError field="processingTime" />
                </div>

                {/* Release Location with Quick Suggestions */}
                <div className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Release Location
                    </label>
                    <CharCount value={formData.location} max={LIMITS.location.max} />
                  </div>
                  <input
                    type="text"
                    maxLength={LIMITS.location.max}
                    placeholder="e.g. Window 2, Barangay Hall"
                    className={inputClass('location')}
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Suggestions:</span>
                    {LOCATION_SUGGESTIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleFieldChange('location', loc)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  <FieldError field="location" />
                </div>

                {/* Claiming Process with Quick Suggestions */}
                <div className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Claiming Process
                    </label>
                    <CharCount value={formData.claimProcess} max={LIMITS.claimProcess.max} />
                  </div>
                  <input
                    type="text"
                    maxLength={LIMITS.claimProcess.max}
                    placeholder="e.g. Present Claim Stub & Valid ID"
                    className={inputClass('claimProcess')}
                    value={formData.claimProcess}
                    onChange={(e) => handleFieldChange('claimProcess', e.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Suggestions:</span>
                    {CLAIMING_SUGGESTIONS.map((claim) => (
                      <button
                        key={claim}
                        type="button"
                        onClick={() => handleFieldChange('claimProcess', claim)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {claim}
                      </button>
                    ))}
                  </div>
                  <FieldError field="claimProcess" />
                </div>
              </div>
            </FormSection>
          ) : (
            <FormSection title="Schedule & Availability">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Operating Days Selector */}
                <div className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Operating Days
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomDaysMode((prev) => !prev)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {customDaysMode ? 'Use Day Selector' : 'Type Custom'}
                      </button>
                      <CharCount value={formData.operatingDays} max={LIMITS.operatingDays.max} />
                    </div>
                  </div>

                  {!customDaysMode ? (
                    <div className="space-y-3">
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyDaysPreset(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            selectedDays.length === 5 && !selectedDays.includes('Sat') && !selectedDays.includes('Sun')
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Mon – Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDaysPreset(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            selectedDays.length === 6 && selectedDays.includes('Sat') && !selectedDays.includes('Sun')
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Mon – Sat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDaysPreset(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            selectedDays.length === 7
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Everyday (Mon – Sun)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyDaysPreset(['Sat', 'Sun'])}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            selectedDays.length === 2 && selectedDays.includes('Sat') && selectedDays.includes('Sun')
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Weekends (Sat – Sun)
                        </button>
                      </div>

                      {/* Individual Day Toggle Pills */}
                      <div>
                        <span className="block text-[11px] text-slate-500 font-medium mb-1.5">
                          Click individual days to toggle:
                        </span>
                        <div className="grid grid-cols-7 gap-1">
                          {DAYS_OF_WEEK.map(({ key, label }) => {
                            const isSelected = selectedDays.includes(key)
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleToggleDay(key)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Output Preview */}
                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Summary:</span>
                        <span className="font-semibold text-slate-800">
                          {formData.operatingDays || <span className="text-slate-400 italic">None selected</span>}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={LIMITS.operatingDays.max}
                        placeholder="e.g. Every 1st and 3rd Saturday"
                        className={inputClass('operatingDays')}
                        value={formData.operatingDays}
                        onChange={(e) => handleFieldChange('operatingDays', e.target.value)}
                      />
                      <p className="text-[11px] text-slate-500">
                        Type your specific operating days schedule. Click "Use Day Selector" above to go back to day buttons.
                      </p>
                    </div>
                  )}
                  <FieldError field="operatingDays" />
                </div>

                {/* Operating Hours Selector */}
                <div className="flex flex-col bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Operating Hours
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomHoursMode((prev) => !prev)}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                      >
                        {customHoursMode ? 'Use Time Pickers' : 'Type Custom'}
                      </button>
                      <CharCount value={formData.operatingHours} max={LIMITS.operatingHours.max} />
                    </div>
                  </div>

                  {!customHoursMode ? (
                    <div className="space-y-3">
                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyHoursPreset('08:00', '17:00')}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            !is24Hours && startTime === '08:00' && endTime === '17:00'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          8:00 AM – 5:00 PM
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyHoursPreset('08:00', '12:00', '8:00 AM - 12:00 NN')}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            !is24Hours && startTime === '08:00' && endTime === '12:00'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          8:00 AM – 12:00 NN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyHoursPreset('13:00', '17:00')}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            !is24Hours && startTime === '13:00' && endTime === '17:00'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          1:00 PM – 5:00 PM
                        </button>
                        <button
                          type="button"
                          onClick={handleToggle24Hours}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                            is24Hours
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          24/7 (Open 24 Hours)
                        </button>
                      </div>

                      {/* Time Picker Inputs */}
                      {!is24Hours ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">
                              Opening Time
                            </label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => handleTimeChange(e.target.value, endTime)}
                              className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">
                              Closing Time
                            </label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => handleTimeChange(startTime, e.target.value)}
                              className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium text-center">
                          Active: Open 24 Hours / 7 Days a week (Round-the-clock)
                        </div>
                      )}

                      {/* Output Preview */}
                      <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Summary:</span>
                        <span className="font-semibold text-slate-800">
                          {formData.operatingHours || <span className="text-slate-400 italic">None selected</span>}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={LIMITS.operatingHours.max}
                        placeholder="e.g. 8:00 AM - 12:00 NN & 1:00 PM - 5:00 PM"
                        className={inputClass('operatingHours')}
                        value={formData.operatingHours}
                        onChange={(e) => handleFieldChange('operatingHours', e.target.value)}
                      />
                      <p className="text-[11px] text-slate-500">
                        Type your specific operating hours phrasing. Click "Use Time Pickers" above to switch back.
                      </p>
                    </div>
                  )}
                  <FieldError field="operatingHours" />
                </div>
              </div>
            </FormSection>
          )}

          <FormSection title="Requirements & Steps Checklist">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requirements */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Requirements (One per line)
                  </label>
                  <CharCount value={formData.requirements} max={LIMITS.requirements.max} />
                </div>
                <textarea
                  rows={5}
                  maxLength={LIMITS.requirements.max}
                  placeholder={`1 Valid Government Issued ID\nCedula (Community Tax Certificate)\nProof of Residency`}
                  className={`${inputClass('requirements')} resize-y font-mono text-xs`}
                  value={formData.requirements}
                  onChange={(e) => handleFieldChange('requirements', e.target.value)}
                />
                <FieldError field="requirements" />
                <p className="mt-1 text-[11px] text-slate-400">
                  Each line appears as a separate checklist item with a checkmark on the public details page.
                </p>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Application Steps (One per line)
                  </label>
                  <CharCount value={formData.steps} max={LIMITS.steps.max} />
                </div>
                <textarea
                  rows={5}
                  maxLength={LIMITS.steps.max}
                  placeholder={`Fill out application form\nSubmit requirements for validation\nPay corresponding fee at treasury\nClaim document at release window`}
                  className={`${inputClass('steps')} resize-y font-mono text-xs`}
                  value={formData.steps}
                  onChange={(e) => handleFieldChange('steps', e.target.value)}
                />
                <FieldError field="steps" />
                <p className="mt-1 text-[11px] text-slate-400">
                  Each line appears as a numbered step (1, 2, 3...) on the public details page.
                </p>
              </div>
            </div>
          </FormSection>
        </div>
      </FormModal>

      {/* Global Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
