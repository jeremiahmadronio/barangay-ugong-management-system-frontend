import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { officialService } from '@/config/api/cms/cms.service'
import type { Official } from '@/config/api/cms/cms.types'
import { Plus, Image as ImageIcon, Upload, Trash2, Pencil } from 'lucide-react'
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
  Avatar,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'

const POSITION_SUGGESTIONS_BY_TYPE: Record<string, string[]> = {
  CAPTAIN: [
    'Punong Barangay',
    'Barangay Captain / Kapitana',
  ],
  KAGAWAD: [
    'Barangay Kagawad - Committee on Health & Sanitation',
    'Barangay Kagawad - Committee on Infrastructure',
    'Barangay Kagawad - Committee on Appropriation & Finance',
    'Barangay Kagawad - Committee on Education & Culture',
    'Barangay Kagawad - Committee on Environment',
  ],
  SK: [
    'SK Chairperson - Committee on Youth & Sports',
    'SK Kagawad',
    'SK Secretary',
    'SK Treasurer',
  ],
  STAFF: [
    'Barangay Secretary',
    'Barangay Treasurer',
    'Barangay Administrator',
    'Executive Assistant',
    'Chief Tanod',
  ],
}

const DEFAULT_POSITION_SUGGESTIONS = [
  'Punong Barangay',
  'Barangay Kagawad - Committee on Health & Sanitation',
  'SK Chairperson - Committee on Youth & Sports',
  'Barangay Secretary',
  'Barangay Treasurer',
]

export const OfficialsManagement = () => {
  const LIMITS = {
    name: { min: 2, max: 70 },
    position: { min: 3, max: 100 },
    imageMaxMb: 5,
  }

  const [officials, setOfficials] = useState<Official[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    type: '',
  })
  const [initialFormData, setInitialFormData] = useState({
    name: '',
    position: '',
    type: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filters state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    type: 'all',
  })

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Search',
        placeholder: 'Search official name or position...',
      },
      {
        key: 'type',
        label: 'Classification',
        options: [
          { label: 'All Classifications', value: 'all' },
          { label: 'Punong Barangay (Kapitana / Captain)', value: 'CAPTAIN' },
          { label: 'Barangay Kagawad', value: 'KAGAWAD' },
          { label: 'Sangguniang Kabataan (SK)', value: 'SK' },
          { label: 'Barangay Staff', value: 'STAFF' },
        ],
      },
    ],
    []
  )

  const safeOfficials = Array.isArray(officials) ? officials : []
  const hasCaptain = safeOfficials.some((o) => o.type === 'CAPTAIN' && o.id !== editingId)

  const checkHasChanges = () => {
    return (
      formData.name !== initialFormData.name ||
      formData.position !== initialFormData.position ||
      formData.type !== initialFormData.type ||
      selectedFile !== null ||
      removeImage !== false
    )
  }

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name': {
        const trimmed = value.trim()
        if (!trimmed) return "Official's full name is required."
        if (trimmed.length < LIMITS.name.min) return `Full name must be at least ${LIMITS.name.min} characters.`
        if (value.length > LIMITS.name.max) return `Full name must not exceed ${LIMITS.name.max} characters.`
        return ''
      }
      case 'position': {
        const trimmed = value.trim()
        if (!trimmed) return 'Official position or title is required.'
        if (trimmed.length < LIMITS.position.min) return `Position must be at least ${LIMITS.position.min} characters.`
        if (value.length > LIMITS.position.max) return `Position must not exceed ${LIMITS.position.max} characters.`
        return ''
      }
      case 'type': {
        if (!value) return 'Classification is required. Please select an option.'
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

  const handleSelectPosition = (pos: string) => {
    handleFieldChange('position', pos)
    if (!formData.type) {
      if (pos.includes('Punong Barangay') || pos.includes('Captain') || pos.includes('Kapitana')) {
        handleFieldChange('type', 'CAPTAIN')
      } else if (pos.startsWith('Committee')) {
        handleFieldChange('type', 'KAGAWAD')
      } else if (pos.startsWith('SK')) {
        handleFieldChange('type', 'SK')
      } else if (
        pos.includes('Secretary') ||
        pos.includes('Treasurer') ||
        pos.includes('Administrator') ||
        pos.includes('Assistant') ||
        pos.includes('Tanod')
      ) {
        handleFieldChange('type', 'STAFF')
      }
    }
  }

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      name: validateField('name', formData.name),
      position: validateField('position', formData.position),
      type: validateField('type', formData.type),
    }
    setErrors(newErrors)
    setTouched({ name: true, position: true, type: true })
    return !Object.values(newErrors).some((err) => Boolean(err))
  }

  const fetchOfficials = useCallback(async () => {
    try {
      setLoading(true)
      const data = await officialService.getOfficials()
      setOfficials(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch officials', error)
      showFeedback({
        variant: 'error',
        title: 'Fetch Error',
        description: 'Failed to load barangay officials.',
      })
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchOfficials()
  }, [fetchOfficials])

  const filteredOfficials = useMemo(() => {
    return safeOfficials.filter((row) => {
      if (filterValues.search?.trim()) {
        const q = filterValues.search.trim().toLowerCase()
        const matchesName = row.name?.toLowerCase().includes(q)
        const matchesPos = row.position?.toLowerCase().includes(q)
        if (!matchesName && !matchesPos) return false
      }
      if (filterValues.type && filterValues.type !== 'all') {
        if (row.type !== filterValues.type) {
          return false
        }
      }
      return true
    })
  }, [safeOfficials, filterValues])

  const handleOpenNew = () => {
    const emptyForm = { name: '', position: '', type: '' }
    setFormData(emptyForm)
    setInitialFormData(emptyForm)
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveImage(false)
    setPhotoError(null)
    setEditingId(null)
    setErrors({})
    setTouched({})
    setOpenModal(true)
  }

  const handleOpenEdit = (official: Official) => {
    const data = {
      name: official.name,
      position: official.position,
      type: official.type,
    }
    setFormData(data)
    setInitialFormData(data)

    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    setPreviewUrl(official.imageUrl ? `${baseUrl}${official.imageUrl}` : null)
    setSelectedFile(null)
    setRemoveImage(false)
    setPhotoError(null)
    setEditingId(official.id)
    setErrors({})
    setTouched({})
    setOpenModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validation 1: file type
      if (!file.type.startsWith('image/')) {
        setPhotoError('Please select a valid image file (PNG, JPG, JPEG, or WEBP).')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      // Validation 2: size limit (5MB)
      if (file.size > LIMITS.imageMaxMb * 1024 * 1024) {
        setPhotoError(`Photo size must not exceed ${LIMITS.imageMaxMb}MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setRemoveImage(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveImage(true)
    setPhotoError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCloseModal = () => {
    if (checkHasChanges()) {
      confirm({
        title: 'Discard Changes?',
        description: 'You have unsaved changes in this official profile. Are you sure you want to discard them?',
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
      const submitData = new FormData()
      submitData.append('name', formData.name.trim())
      submitData.append('position', formData.position.trim())
      submitData.append('type', formData.type)

      if (selectedFile) {
        submitData.append('image', selectedFile)
      }
      if (removeImage) {
        submitData.append('removeImage', 'true')
      }

      if (editingId) {
        await officialService.updateOfficial(editingId, submitData)
        showFeedback({
          variant: 'success',
          title: 'Official Updated',
          description: `Information for "${formData.name.trim()}" has been updated successfully.`,
        })
      } else {
        await officialService.createOfficial(submitData)
        showFeedback({
          variant: 'success',
          title: 'Official Added',
          description: `"${formData.name.trim()}" has been added to the barangay directory.`,
        })
      }

      setOpenModal(false)
      fetchOfficials()
    } catch (error) {
      console.error(error)
      showFeedback({
        variant: 'error',
        title: 'Save Failed',
        description: 'Could not save official details. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (official: Official) => {
    confirm({
      title: 'Delete Official?',
      description: `Are you sure you want to remove "${official.name}" (${official.position}) from the directory? This action cannot be undone.`,
      tone: 'danger',
      confirmLabel: 'Delete Official',
      onConfirm: async () => {
        try {
          await officialService.deleteOfficial(official.id)
          fetchOfficials()
          showFeedback({
            variant: 'success',
            title: 'Official Removed',
            description: `"${official.name}" has been removed from the directory.`,
          })
        } catch (error) {
          console.error(error)
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: 'Could not remove official. Please try again.',
          })
        }
      },
    })
  }

  // DataTable columns
  const columns: Column<Official>[] = useMemo(
    () => [
      {
        key: 'imageUrl',
        header: 'PHOTO',
        render: (row) => {
          const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
          return row.imageUrl ? (
            <img
              src={`${baseUrl}${row.imageUrl}`}
              alt={row.name}
              className="w-10 h-10 object-cover rounded-full border border-slate-200 shadow-2xs"
            />
          ) : (
            <Avatar name={row.name} />
          )
        },
      },
      {
        key: 'name',
        header: 'OFFICIAL NAME',
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-900 text-sm">{row.name}</div>
          </div>
        ),
      },
      {
        key: 'position',
        header: 'POSITION / TITLE',
        render: (row) => (
          <span className="text-sm font-medium text-slate-700">{row.position}</span>
        ),
      },
      {
        key: 'type',
        header: 'CLASSIFICATION',
        render: (row) => {
          const tone =
            row.type === 'CAPTAIN'
              ? 'emerald'
              : row.type === 'KAGAWAD'
              ? 'sky'
              : row.type === 'SK'
              ? 'violet'
              : row.type === 'STAFF'
              ? 'indigo'
              : 'slate'
          const label =
            row.type === 'CAPTAIN'
              ? 'Punong Barangay (Kapitana)'
              : row.type === 'KAGAWAD'
              ? 'Barangay Kagawad'
              : row.type === 'SK'
              ? 'Sangguniang Kabataan (SK)'
              : row.type === 'STAFF'
              ? 'Barangay Staff'
              : row.type
          return <Badge tone={tone}>{label}</Badge>
        },
      },
    ],
    []
  )

  const tableActions: RowAction<Official>[] = useMemo(
    () => [
      {
        id: 'edit',
        label: 'Edit Official',
        icon: Pencil,
        tone: 'primary',
        onClick: (row) => handleOpenEdit(row),
      },
      {
        id: 'delete',
        label: 'Delete Official',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDelete(row),
      },
    ],
    [handleOpenEdit, handleDelete]
  )

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay Officials Management"
        description="Manage the roster and public profile of elected leaders and appointed barangay officers."
        actions={[
          {
            label: 'Add Official',
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
        <LoadingState message="Loading officials..." />
      ) : (
        <DataTable
          data={filteredOfficials}
          columns={columns}
          rowKey={(row) => row.id}
          actions={tableActions}
          pageSize={7}
          emptyTitle="No officials found"
          emptyDescription="No barangay officials match your current filter. Try searching for a different name or add an official."
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={openModal}
        title={editingId ? 'Edit Official' : 'Add New Official'}
        submitLabel={isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Save Official'}
        isSubmitting={isSubmitting}
        maxWidthClass="max-w-2xl"
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          <FormSection title="Official Details">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <CharCount value={formData.name} max={LIMITS.name.max} min={LIMITS.name.min} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Hon. Juan Dela Cruz"
                  maxLength={LIMITS.name.max}
                  className={inputClass('name')}
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
                <FieldError field="name" />
              </div>

              {/* Classification */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  className={inputClass('type')}
                  value={formData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                >
                  <option value="" disabled>
                    -- Select Classification --
                  </option>
                  <option value="CAPTAIN" disabled={hasCaptain}>
                    Punong Barangay (Kapitana / Captain) {hasCaptain ? '(Already Registered)' : ''}
                  </option>
                  <option value="KAGAWAD">Barangay Kagawad (Councilor)</option>
                  <option value="SK">Sangguniang Kabataan (SK)</option>
                  <option value="STAFF">Barangay Staff (Secretary / Treasurer / Admin)</option>
                </select>
                <FieldError field="type" />
              </div>

              {/* Official Position */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Official Position <span className="text-rose-500">*</span>
                  </label>
                  <CharCount value={formData.position} max={LIMITS.position.max} min={LIMITS.position.min} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Barangay Kagawad - Committee on Health & Sanitation"
                  maxLength={LIMITS.position.max}
                  className={inputClass('position')}
                  value={formData.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                />

                {/* Quick Position Suggestions */}
                <div className="mt-2 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Suggestions:</span>
                  {(POSITION_SUGGESTIONS_BY_TYPE[formData.type] || DEFAULT_POSITION_SUGGESTIONS).map((pos) => {
                    const isSelected = formData.position === pos
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleSelectPosition(pos)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {pos}
                      </button>
                    )
                  })}
                </div>

                <FieldError field="position" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Profile Photo">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Select Photo
                  </button>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  PNG, JPG, JPEG or WEBP up to {LIMITS.imageMaxMb}MB. Recommended square format.
                </p>
                {photoError && (
                  <p className="text-xs text-rose-500 font-medium">
                    {photoError}
                  </p>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
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
export default OfficialsManagement
