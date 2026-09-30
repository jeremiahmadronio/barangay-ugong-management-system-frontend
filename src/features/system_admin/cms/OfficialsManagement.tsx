import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { officialApi } from '../../../cms-api/officialApi'
import type { Official } from '../../../cms-api/officialApi'
import { Plus, Trash2, Image as ImageIcon, Pencil, Upload, X } from 'lucide-react'
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
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table'
import { useDialogs } from '@/hooks/useDialogs'

export const OfficialsManagement = () => {
  const LIMITS = {
    name: { min: 2, max: 70 },
    position: { min: 3, max: 100 },
    customType: { min: 2, max: 50 },
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
  const [customType, setCustomType] = useState('')
  const [initialCustomType, setInitialCustomType] = useState('')
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
          { label: 'Punong Barangay (Captain)', value: 'CAPTAIN' },
          { label: 'Barangay Kagawad', value: 'KAGAWAD' },
          { label: 'Barangay Staff', value: 'STAFF' },
          { label: 'Other Officials', value: 'OTHERS' },
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
      (formData.type === 'OTHERS' && customType !== initialCustomType) ||
      selectedFile !== null ||
      removeImage !== false
    )
  }

  const validateField = (field: string, value: string, currentType = formData.type): string => {
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
      case 'customType': {
        if (currentType === 'OTHERS') {
          const trimmed = value.trim()
          if (!trimmed) return 'Custom role specification is required.'
          if (trimmed.length < LIMITS.customType.min) return `Role must be at least ${LIMITS.customType.min} characters.`
          if (value.length > LIMITS.customType.max) return `Role must not exceed ${LIMITS.customType.max} characters.`
        }
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
      [field]: validateField(field, value, field === 'type' ? value : formData.type),
    }))
  }

  const handleCustomTypeChange = (value: string) => {
    setCustomType(value)
    setTouched((prev) => ({ ...prev, customType: true }))
    setErrors((prev) => ({
      ...prev,
      customType: validateField('customType', value, formData.type),
    }))
  }

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      name: validateField('name', formData.name),
      position: validateField('position', formData.position),
      type: validateField('type', formData.type),
      customType: formData.type === 'OTHERS' ? validateField('customType', customType) : '',
    }
    setErrors(newErrors)
    setTouched({ name: true, position: true, type: true, customType: true })
    return !Object.values(newErrors).some((err) => Boolean(err))
  }

  const fetchOfficials = useCallback(async () => {
    try {
      setLoading(true)
      const data = await officialApi.getOfficials()
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
        if (filterValues.type === 'OTHERS') {
          if (['CAPTAIN', 'KAGAWAD', 'STAFF'].includes(row.type)) return false
        } else if (row.type !== filterValues.type) {
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
    setCustomType('')
    setInitialCustomType('')
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
    const isPredefined = ['CAPTAIN', 'KAGAWAD', 'STAFF'].includes(official.type)
    const data = {
      name: official.name,
      position: official.position,
      type: isPredefined ? official.type : 'OTHERS',
    }
    setFormData(data)
    setInitialFormData(data)
    setCustomType(isPredefined ? '' : official.type)
    setInitialCustomType(isPredefined ? '' : official.type)

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

      const finalType = formData.type === 'OTHERS' ? customType.trim() : formData.type
      submitData.append('type', finalType)

      if (selectedFile) {
        submitData.append('image', selectedFile)
      }
      if (removeImage) {
        submitData.append('removeImage', 'true')
      }

      if (editingId) {
        await officialApi.updateOfficial(editingId, submitData)
        showFeedback({
          variant: 'success',
          title: 'Official Updated',
          description: `Information for "${formData.name.trim()}" has been updated successfully.`,
        })
      } else {
        await officialApi.createOfficial(submitData)
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
          await officialApi.deleteOfficial(official.id)
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
              : row.type === 'STAFF'
              ? 'slate'
              : 'amber'
          const label =
            row.type === 'CAPTAIN'
              ? 'Punong Barangay'
              : row.type === 'KAGAWAD'
              ? 'Barangay Kagawad'
              : row.type === 'STAFF'
              ? 'Barangay Staff'
              : row.type
          return <Badge tone={tone}>{label}</Badge>
        },
      },
      {
        key: 'actions',
        header: 'ACTIONS',
        align: 'center',
        render: (row) => (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors cursor-pointer"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
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
      <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
        <span>⚠</span> {errors[field]}
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
                  placeholder="e.g. Committee Chairman on Peace and Order"
                  maxLength={LIMITS.position.max}
                  className={inputClass('position')}
                  value={formData.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                />
                <FieldError field="position" />
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
                    Punong Barangay (Captain) {hasCaptain ? '(Already Registered)' : ''}
                  </option>
                  <option value="KAGAWAD">Barangay Kagawad (Councilor)</option>
                  <option value="STAFF">Appointed Staff (Secretary / Treasurer / Admin)</option>
                  <option value="OTHERS">Other / Custom Role</option>
                </select>
                <FieldError field="type" />
              </div>

              {/* Custom Role Input */}
              {formData.type === 'OTHERS' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Specify Custom Role <span className="text-rose-500">*</span>
                    </label>
                    <CharCount value={customType} max={LIMITS.customType.max} min={LIMITS.customType.min} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. SK Chairperson, Chief Tanod"
                    maxLength={LIMITS.customType.max}
                    className={inputClass('customType')}
                    value={customType}
                    onChange={(e) => handleCustomTypeChange(e.target.value)}
                  />
                  <FieldError field="customType" />
                </div>
              )}
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
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                    <span>⚠</span> {photoError}
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
