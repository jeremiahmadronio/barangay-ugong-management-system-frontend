import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Pencil,
} from 'lucide-react'
import { announcementApi } from '@/config/api/cms/announcementApi'
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
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'
import { useAuth } from '@/hooks/useAuth'

interface AnnouncementModalProps {
  open: boolean
  announcement: any | null
  authorName: string
  onClose: () => void
  onSuccess: () => void
  showFeedback: (opts: any) => void
  confirm: (opts: any) => void
}

function AnnouncementFormModal({
  open,
  announcement,
  authorName,
  onClose,
  onSuccess,
  showFeedback,
  confirm,
}: AnnouncementModalProps) {
  const LIMITS = {
    title: { min: 3, max: 100 },
    excerpt: { max: 300 },
    content: { min: 10, max: 5000 },
    calendarLocation: { max: 150 },
  }

  const [formData, setFormData] = useState({
    title: '',
    category: 'Community',
    excerpt: '',
    content: '',
    showInCalendar: false,
    calendarDate: '',
    calendarLocation: '',
  })
  const [initialFormData, setInitialFormData] = useState({
    title: '',
    category: 'Community',
    excerpt: '',
    content: '',
    showInCalendar: false,
    calendarDate: '',
    calendarLocation: '',
  })

  // Validation errors & touched tracking
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (field: string, value: string, showInCalendar?: boolean): string => {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'Announcement title is required.'
        if (value.trim().length < LIMITS.title.min) return `Title must be at least ${LIMITS.title.min} characters.`
        if (value.length > LIMITS.title.max) return `Title must not exceed ${LIMITS.title.max} characters.`
        return ''
      case 'content':
        if (!value.trim()) return 'Full content details are required.'
        if (value.trim().length < LIMITS.content.min) return `Content must be at least ${LIMITS.content.min} characters.`
        if (value.length > LIMITS.content.max) return `Content must not exceed ${LIMITS.content.max} characters.`
        return ''
      case 'excerpt':
        if (value.length > LIMITS.excerpt.max) return `Excerpt must not exceed ${LIMITS.excerpt.max} characters.`
        return ''
      case 'calendarLocation':
        if (value.length > LIMITS.calendarLocation.max) return `Location must not exceed ${LIMITS.calendarLocation.max} characters.`
        return ''
      case 'calendarDate':
        if (showInCalendar && !value) return 'Event date is required when calendar is enabled.'
        return ''
      default:
        return ''
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, formData.showInCalendar),
    }))
  }

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      title: validateField('title', formData.title),
      content: validateField('content', formData.content),
      excerpt: validateField('excerpt', formData.excerpt),
      calendarLocation: validateField('calendarLocation', formData.calendarLocation),
      calendarDate: validateField('calendarDate', formData.calendarDate, formData.showInCalendar),
    }
    setErrors(newErrors)
    setTouched({ title: true, content: true, excerpt: true, calendarLocation: true, calendarDate: true })
    return Object.values(newErrors).every((e) => !e)
  }

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([])
  const [previewAdditionalUrls, setPreviewAdditionalUrls] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize or reset form state whenever modal opens or announcement changes
  useEffect(() => {
    if (!open) return

    if (announcement) {
      let content = announcement.content || ''
      let showInCalendar = false
      let calendarDate = ''
      let calendarLocation = ''

      const dateMatch = content.match(/<!-- SHOW_IN_CALENDAR:\s*(.*?)\s*-->/)
      if (dateMatch) {
        showInCalendar = true
        calendarDate = dateMatch[1]
        content = content.replace(dateMatch[0], '').trim()
      }

      const locMatch = content.match(/<!-- LOCATION:\s*(.*?)\s*-->/)
      if (locMatch) {
        calendarLocation = locMatch[1]
        content = content.replace(locMatch[0], '').trim()
      }

      const data = {
        title: announcement.title || '',
        category: announcement.category || 'Community',
        excerpt: announcement.excerpt || '',
        content,
        showInCalendar,
        calendarDate,
        calendarLocation,
      }
      setFormData(data)
      setInitialFormData(data)

      const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
      setPreviewUrl(announcement.imageUrl ? `${baseUrl}${announcement.imageUrl}` : null)
      setSelectedFile(null)
      setRemoveImage(false)

      setAdditionalImages(announcement.additionalImages || [])
      setPreviewAdditionalUrls((announcement.additionalImages || []).map((url: string) => `${baseUrl}${url}`))
      setAdditionalImageFiles([])
    } else {
      const emptyForm = {
        title: '',
        category: 'Community',
        excerpt: '',
        content: '',
        showInCalendar: false,
        calendarDate: '',
        calendarLocation: '',
      }
      setFormData(emptyForm)
      setInitialFormData(emptyForm)
      setSelectedFile(null)
      setPreviewUrl(null)
      setRemoveImage(false)
      setAdditionalImages([])
      setAdditionalImageFiles([])
      setPreviewAdditionalUrls([])
    }
    // Reset validation on open
    setErrors({})
    setTouched({})
  }, [open, announcement])

  const checkHasChanges = useCallback(() => {
    return (
      formData.title !== initialFormData.title ||
      formData.category !== initialFormData.category ||
      formData.excerpt !== initialFormData.excerpt ||
      formData.content !== initialFormData.content ||
      formData.showInCalendar !== initialFormData.showInCalendar ||
      formData.calendarDate !== initialFormData.calendarDate ||
      formData.calendarLocation !== initialFormData.calendarLocation ||
      selectedFile !== null ||
      removeImage !== false ||
      additionalImageFiles.length > 0
    )
  }, [formData, initialFormData, selectedFile, removeImage, additionalImageFiles])

  const handleRequestClose = useCallback(() => {
    if (checkHasChanges()) {
      confirm({
        title: 'Discard Changes?',
        description: 'You have unsaved changes in this announcement. Are you sure you want to discard them?',
        tone: 'warning',
        confirmLabel: 'Discard Changes',
        onConfirm: () => {
          onClose()
        },
      })
    } else {
      onClose()
    }
  }, [checkHasChanges, confirm, onClose])

  const handleUnifiedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      let i = 0
      if (!previewUrl) {
        const coverFile = files[0]
        setSelectedFile(coverFile)
        setPreviewUrl(URL.createObjectURL(coverFile))
        setRemoveImage(false)
        i++
      }

      if (i < files.length) {
        const remaining = files.slice(i)
        setAdditionalImageFiles((prev) => [...prev, ...remaining])
        const newPreviewUrls = remaining.map((f) => URL.createObjectURL(f))
        setPreviewAdditionalUrls((prev) => [...prev, ...newPreviewUrls])
      }
    }
  }

  const handleRemoveAdditionalImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setAdditionalImages((prev) => prev.filter((_, i) => i !== index))
      setPreviewAdditionalUrls((prev) => prev.filter((_, i) => i !== index))
    } else {
      const newFileIndex = index - additionalImages.length
      setAdditionalImageFiles((prev) => prev.filter((_, i) => i !== newFileIndex))
      setPreviewAdditionalUrls((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleRemoveCover = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveImage(true)
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
      const submitData = new FormData()
      submitData.append('author', authorName)

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'showInCalendar' || key === 'calendarDate' || key === 'calendarLocation') return
        if (key === 'content') {
          let modifiedContent = value as string
          if (formData.showInCalendar && formData.calendarDate) {
            modifiedContent += `\n\n<!-- SHOW_IN_CALENDAR: ${formData.calendarDate} -->`
          }
          if (formData.calendarLocation) {
            modifiedContent += `\n\n<!-- LOCATION: ${formData.calendarLocation} -->`
          }
          submitData.append(key, modifiedContent)
        } else {
          submitData.append(key, value as string)
        }
      })

      if (selectedFile) {
        submitData.append('image', selectedFile)
      }
      if (removeImage) {
        submitData.append('removeImage', 'true')
      }

      if (additionalImages.length > 0) {
        additionalImages.forEach((url) => {
          submitData.append('additionalImages', url)
        })
      } else if (announcement?.id) {
        submitData.append('clearAdditionalImages', 'true')
      }

      additionalImageFiles.forEach((file) => {
        submitData.append('additionalImageFiles', file)
      })

      if (announcement?.id) {
        await announcementApi.updateAnnouncement(announcement.id, submitData)
        showFeedback({
          variant: 'success',
          title: 'Announcement Updated',
          description: `"${formData.title}" has been updated successfully.`,
        })
      } else {
        await announcementApi.createAnnouncement(submitData)
        showFeedback({
          variant: 'success',
          title: 'Announcement Created',
          description: `"${formData.title}" has been created and published.`,
        })
      }

      onSuccess()
    } catch (error) {
      console.error(error)
      showFeedback({
        variant: 'error',
        title: 'Save Failed',
        description: 'Could not save announcement. Please check your inputs and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (field?: string) =>
    `w-full px-3.5 py-2 text-sm rounded-lg border ${
      field && errors[field] && touched[field]
        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
        : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500/20'
    } text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:bg-white focus:ring-2`

  const FieldError = ({ field }: { field: string }) =>
    touched[field] && errors[field] ? (
      <p className="mt-1 text-xs text-rose-500 font-medium">
        {errors[field]}
      </p>
    ) : null

  const CharCount = ({ value, max, min }: { value: string; max: number; min?: number }) => {
    const len = value.length
    const isOver = len > max
    return (
      <span className={`text-[11px] font-medium ${
        isOver ? 'text-rose-500' : 'text-slate-400'
      }`}>
        {len}/{max}
      </span>
    )
  }

  return (
    <FormModal
      open={open}
      title={announcement ? 'Edit Announcement' : 'Create New Announcement'}
      submitLabel={isSubmitting ? 'Saving...' : announcement ? 'Save Changes' : 'Create Announcement'}
      isSubmitting={isSubmitting}
      maxWidthClass="max-w-3xl"
      onClose={handleRequestClose}
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <FormSection
          title="General Information"
        >
          <div className="space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Announcement Title <span className="text-rose-500">*</span>
                </label>
                <CharCount value={formData.title} max={LIMITS.title.max} min={LIMITS.title.min} />
              </div>
              <input
                type="text"
                placeholder="e.g. 3RD QUARTER BNC MEETING"
                className={inputClass('title')}
                value={formData.title}
                maxLength={LIMITS.title.max}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
              <FieldError field="title" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  className={inputClass()}
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Community">Community</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Sports">Sports</option>
                  <option value="Government">Government</option>
                  <option value="Environment">Environment</option>
                </select>
              </div>
              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Location (Optional)
                  </label>
                  <CharCount value={formData.calendarLocation} max={LIMITS.calendarLocation.max} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Barangay Ugong Covered Court"
                  className={inputClass('calendarLocation')}
                  value={formData.calendarLocation}
                  maxLength={LIMITS.calendarLocation.max}
                  onChange={(e) => handleFieldChange('calendarLocation', e.target.value)}
                />
                <FieldError field="calendarLocation" />
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Full Content Details <span className="text-rose-500">*</span>
                </label>
                <CharCount value={formData.content} max={LIMITS.content.max} min={LIMITS.content.min} />
              </div>
              <textarea
                rows={5}
                placeholder="Full advisory or announcement message..."
                className={`${inputClass('content')} resize-y`}
                value={formData.content}
                maxLength={LIMITS.content.max}
                onChange={(e) => handleFieldChange('content', e.target.value)}
              />
              <FieldError field="content" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Calendar Link & Scheduling"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showInCalendar}
                onChange={(e) => setFormData((prev) => ({ ...prev, showInCalendar: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-800">
                Show this announcement in the Barangay Calendar
              </span>
            </label>

            {formData.showInCalendar && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className={inputClass('calendarDate')}
                  value={formData.calendarDate}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, calendarDate: e.target.value }))
                    setTouched((prev) => ({ ...prev, calendarDate: true }))
                    setErrors((prev) => ({
                      ...prev,
                      calendarDate: validateField('calendarDate', e.target.value, true),
                    }))
                  }}
                />
                <FieldError field="calendarDate" />
              </div>
            )}
          </div>
        </FormSection>

        <FormSection
          title="Attached Images"
        >
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-56 flex items-center justify-center group">
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="p-1.5 bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-700 transition-colors cursor-pointer"
                    title="Remove Cover Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/80 text-white text-[11px] font-bold rounded-md">
                  Cover Banner
                </span>
              </div>
            )}

            {previewAdditionalUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {previewAdditionalUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-video group"
                  >
                    <img src={url} alt={`Extra ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveAdditionalImage(idx, idx < additionalImages.length)
                      }
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Click to select images
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Upload cover photo or supplementary files (JPG, PNG, GIF)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleUnifiedFilesChange}
              />
            </div>
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}

export default function AnnouncementsManagement() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // ── Fetch Announcements ──
  const fetchAnnouncements = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await announcementApi.getAllAnnouncements()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch announcements', error)
      showFeedback({
        variant: 'error',
        title: 'Fetch Error',
        description: 'Failed to load announcements from server.',
      })
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  // ── Reusable TableFilters state ──
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    category: 'all',
  })

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Search',
        placeholder: 'Search title, content, or excerpt...',
      },
      {
        key: 'category',
        label: 'Category',
        options: [
          { label: 'All Categories', value: 'all' },
          { label: 'Health', value: 'Health' },
          { label: 'Education', value: 'Education' },
          { label: 'Community', value: 'Community' },
          { label: 'Sports', value: 'Sports' },
          { label: 'Government', value: 'Government' },
          { label: 'Environment', value: 'Environment' },
        ],
      },
    ],
    []
  )

  // Filtered dataset
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((row) => {
      if (filterValues.search?.trim()) {
        const q = filterValues.search.trim().toLowerCase()
        const matchesTitle = row.title?.toLowerCase().includes(q)
        const matchesContent = row.content?.toLowerCase().includes(q)
        const matchesExcerpt = row.excerpt?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesContent && !matchesExcerpt) return false
      }
      if (filterValues.category && filterValues.category !== 'all') {
        if (row.category?.toLowerCase() !== filterValues.category.toLowerCase()) return false
      }
      return true
    })
  }, [announcements, filterValues])

  const handleOpenNew = useCallback(() => {
    setEditingAnnouncement(null)
    setOpenModal(true)
  }, [])

  const handleOpenEdit = useCallback((announcement: any) => {
    setEditingAnnouncement(announcement)
    setOpenModal(true)
  }, [])

  // Optimistic Publish Toggle
  const handleTogglePublish = useCallback(
    async (row: any) => {
      const currentStatus = Boolean(row.published ?? row.isPublished)
      const newStatus = !currentStatus
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === row.id ? { ...a, published: newStatus, isPublished: newStatus } : a))
      )

      try {
        await announcementApi.togglePublish(row.id)
        showFeedback({
          variant: 'success',
          title: newStatus ? 'Announcement Published' : 'Announcement Unpublished',
          description: `"${row.title}" is now ${newStatus ? 'visible to the public' : 'saved as draft'}.`,
        })
      } catch (error) {
        console.error(error)
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === row.id ? { ...a, published: currentStatus, isPublished: currentStatus } : a))
        )
        showFeedback({
          variant: 'error',
          title: 'Update Failed',
          description: 'Failed to update publish state.',
        })
      }
    },
    [showFeedback]
  )

  const handleDelete = useCallback(
    (row: any) => {
      confirm({
        title: 'Delete Announcement?',
        description: `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
        tone: 'danger',
        confirmLabel: 'Delete Announcement',
        onConfirm: async () => {
          try {
            await announcementApi.deleteAnnouncement(row.id)
            fetchAnnouncements(false)
            showFeedback({
              variant: 'success',
              title: 'Announcement Deleted',
              description: `"${row.title}" has been permanently removed.`,
            })
          } catch (error) {
            console.error(error)
            showFeedback({
              variant: 'error',
              title: 'Delete Failed',
              description: 'Could not delete announcement.',
            })
          }
        },
      })
    },
    [confirm, showFeedback, fetchAnnouncements]
  )

  // ── Columns definition matching exact layout: IMAGE | TITLE | CATEGORY | DATE | PUBLISHED | ACTIONS ──
  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: 'imageUrl',
        header: 'IMAGE',
        render: (row) => {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
          return row.imageUrl ? (
            <img
              src={`${baseUrl}${row.imageUrl}`}
              alt="thumb"
              className="w-12 h-10 object-cover rounded-md border border-slate-200 shadow-2xs"
            />
          ) : (
            <div className="w-12 h-10 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-5 h-5" />
            </div>
          )
        },
      },
      {
        key: 'title',
        header: 'TITLE',
        render: (row) => (
          <span className="text-slate-800 text-sm font-semibold uppercase tracking-wide">
            {row.title}
          </span>
        ),
      },
      {
        key: 'category',
        header: 'CATEGORY',
        render: (row) => (
          <span className="text-slate-600 text-sm font-medium">
            {row.category || 'General'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'DATE',
        render: (row) => {
          const dt = new Date(row.createdAt)
          return (
            <span className="text-slate-600 text-sm font-medium whitespace-nowrap">
              {isNaN(dt.getTime())
                ? '—'
                : dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )
        },
      },
      {
        key: 'published',
        header: 'PUBLISHED',
        align: 'center',
        render: (row) => (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(row.published ?? row.isPublished)}
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
        label: 'Edit Announcement',
        icon: Pencil,
        tone: 'primary',
        onClick: (row) => handleOpenEdit(row),
      },
      {
        id: 'delete',
        label: 'Delete Announcement',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDelete(row),
      },
    ],
    [handleOpenEdit, handleDelete]
  )

  const authorName = user
    ? user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.name || 'Admin'
    : 'Barangay Admin'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Announcements Management"
        description="Create, publish, and manage public barangay advisories and community announcements."
        actions={[
          {
            label: 'Add Announcement',
            icon: Plus,
            onClick: handleOpenNew,
          },
        ]}
      />

      {/* Reusable Clean TableFilters */}
      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={(applied) => setFilterValues(applied)}
        onClear={() => setFilterValues({ search: '', category: 'all' })}
      />

      {/* Main Table Card */}
      {loading ? (
        <LoadingState message="Loading announcements..." />
      ) : (
        <DataTable
          data={filteredAnnouncements}
          columns={columns}
          rowKey={(row) => row.id}
          actions={tableActions}
          pageSize={7}
          emptyTitle="No announcements found."
          emptyDescription="Try adjusting your filters or create a new announcement."
        />
      )}

      {/* Form Modal for Add / Edit */}
      <AnnouncementFormModal
        open={openModal}
        announcement={editingAnnouncement}
        authorName={authorName}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          setOpenModal(false)
          fetchAnnouncements(false)
        }}
        showFeedback={showFeedback}
        confirm={confirm}
      />

      {/* Global Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  )
}
