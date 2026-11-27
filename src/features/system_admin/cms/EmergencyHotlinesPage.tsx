import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Plus, Trash2, Pencil, Shield, Flame, Ambulance } from 'lucide-react';
import { useWebsiteSettings } from '../../../context/WebsiteSettingsContext';
import { settingsService } from '@/config/api/cms/cms.service'
import {
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  FormModal,
  FormSection,
  LoadingState,
} from '@/components/ui';
import {
  DataTable,
  TableFilters,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from '@/components/ui/table';
import { useDialogs } from '@/hooks/useDialogs';

const MAX_NAME_LENGTH = 45;
const MIN_NAME_LENGTH = 2;

export type NumberCategory = 'short' | 'landline' | 'mobile';

export interface HotlineNumberEntry {
  type: NumberCategory;
  suffix: string;
}

export interface HotlineItem {
  name: string;
  number: string;
  icon: string;
}

export const detectCategory = (num: string): NumberCategory => {
  const digits = (num || '').replace(/\D/g, '');
  if (digits.length > 0 && digits.length <= 5) return 'short';
  if (
    digits.startsWith('09') ||
    digits.startsWith('639') ||
    (num || '').startsWith('+63 9') ||
    (num || '').startsWith('09')
  )
    return 'mobile';
  return 'landline';
};

export const sanitizeNumberInput = (raw: string, type: NumberCategory): string => {
  let digits = (raw || '').replace(/\D/g, '');
  if (type === 'landline') {
    if (digits.startsWith('020') && digits.length >= 11) {
      digits = digits.slice(3, 11);
    } else if (digits.startsWith('02') && digits.length >= 10) {
      digits = digits.slice(2, 10);
    } else {
      digits = digits.slice(0, 8);
    }
  } else if (type === 'mobile') {
    if (digits.startsWith('639') && digits.length >= 12) {
      digits = digits.slice(3, 12);
    } else if (digits.startsWith('09') && digits.length >= 11) {
      digits = digits.slice(2, 11);
    } else if (digits.startsWith('9') && digits.length === 10) {
      digits = digits.slice(1, 10);
    } else {
      digits = digits.slice(0, 9);
    }
  } else {
    digits = digits.slice(0, 4);
  }
  return digits;
};

export const extractSuffix = (fullVal: string, type: NumberCategory): string => {
  const trimmed = (fullVal || '').trim();
  if (!trimmed) return '';
  return sanitizeNumberInput(trimmed, type);
};

export const buildFullNumber = (suffix: string, type: NumberCategory): string => {
  const s = suffix.trim();
  if (!s) return '';
  if (type === 'landline') return `(02) ${s}`;
  if (type === 'mobile') return `09${s}`;
  return s;
};

export const parseNumberEntries = (numberField: string): HotlineNumberEntry[] => {
  const lines = (numberField || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [{ type: 'landline', suffix: '' }];
  }
  return lines.slice(0, 3).map((line) => {
    const type = detectCategory(line);
    const suffix = extractSuffix(line, type);
    return { type, suffix };
  });
};

export const validateEntryNumber = (
  entry: HotlineNumberEntry,
  isRequired = false
): string | null => {
  const s = entry.suffix.trim();
  if (!s) {
    return isRequired ? 'Contact number is required.' : null;
  }
  if (entry.type === 'landline') {
    if (s.length !== 8) return 'Landline must be exactly 8 digits.';
  } else if (entry.type === 'mobile') {
    if (s.length !== 9) return 'Mobile must be 9 digits after 09 (e.g. 0917-xxx-xxxx).';
  } else if (entry.type === 'short') {
    if (s.length < 3 || s.length > 4) return 'Short code must be 3 or 4 digits (e.g. 911).';
  }
  return null;
};

const CATEGORY_OPTIONS = [
  {
    id: 'police',
    label: 'Police & Security',
    icon: Shield,
    border: 'border-blue-200 hover:border-blue-400',
    selectedBg: 'bg-blue-50 border-blue-500 text-blue-700',
    iconColor: 'text-blue-600',
  },
  {
    id: 'fire',
    label: 'Fire & Rescue',
    icon: Flame,
    border: 'border-rose-200 hover:border-rose-400',
    selectedBg: 'bg-rose-50 border-rose-500 text-rose-700',
    iconColor: 'text-rose-600',
  },
  {
    id: 'ambulance',
    label: 'Medical & Ambulance',
    icon: Ambulance,
    border: 'border-emerald-200 hover:border-emerald-400',
    selectedBg: 'bg-emerald-50 border-emerald-500 text-emerald-700',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'phone',
    label: 'General Response',
    icon: Phone,
    border: 'border-slate-200 hover:border-slate-400',
    selectedBg: 'bg-slate-100 border-slate-500 text-slate-800',
    iconColor: 'text-slate-600',
  },
];

const QUICK_DEPARTMENT_PRESETS = [
  'National Emergency Hotline',
  'Barangay Emergency Response (BDRRMC)',
  'Bureau of Fire Protection (BFP)',
  'Barangay Health Center',
  'Philippine National Police (PNP)',
  'Barangay Public Safety Officers (BPSO)',
];

const DEFAULT_HOTLINES: HotlineItem[] = [
  { name: 'National Emergency Hotline', number: '911', icon: 'police' },
  { name: 'Barangay Emergency Response', number: '0917 555 8823', icon: 'phone' },
  { name: 'Bureau of Fire Protection', number: '(02) 8292 2222', icon: 'fire' },
  { name: 'Barangay Health Center', number: '(02) 8291 1111', icon: 'ambulance' },
];

function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const len = value?.length ?? 0;
  const isNear = len >= max * 0.85;
  const isOver = len > max;
  const isUnder = min !== undefined && len > 0 && len < min;

  return (
    <span
      className={`text-[11px] tabular-nums font-medium transition-colors ${
        isOver
          ? 'text-rose-500 font-bold'
          : isUnder
          ? 'text-amber-500'
          : isNear
          ? 'text-amber-500'
          : 'text-slate-400'
      }`}
    >
      {len}/{max}
    </span>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>;
}

export const EmergencyHotlinesPage: React.FC = () => {
  const { updateSettingLocal, refreshSettings } = useWebsiteSettings();
  const [loading, setLoading] = useState(true);
  const [hotlines, setHotlines] = useState<HotlineItem[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();

  // Form modal state
  const [formData, setFormData] = useState<{
    name: string;
    icon: string;
    entries: HotlineNumberEntry[];
  }>({
    name: '',
    icon: 'phone',
    entries: [{ type: 'landline', suffix: '' }],
  });

  const [initialFormData, setInitialFormData] = useState<{
    name: string;
    icon: string;
    entries: HotlineNumberEntry[];
  }>({
    name: '',
    icon: 'phone',
    entries: [{ type: 'landline', suffix: '' }],
  });

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [numberErrors, setNumberErrors] = useState<(string | undefined)[]>([]);

  // Filter state for DataTable
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    category: 'all',
  });

  useEffect(() => {
    fetchHotlines();
  }, []);

  const fetchHotlines = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAllSettings();
      if (data['content.emergencyHotlines']) {
        const parsed = JSON.parse(data['content.emergencyHotlines']);
        setHotlines(Array.isArray(parsed) ? parsed : DEFAULT_HOTLINES);
      } else {
        setHotlines(DEFAULT_HOTLINES);
      }
    } catch (e) {
      console.error(e);
      showFeedback({
        variant: 'error',
        title: 'Load Error',
        description: 'Failed to load emergency hotlines.',
      });
      setHotlines(DEFAULT_HOTLINES);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    const emptyForm = {
      name: '',
      icon: 'phone',
      entries: [{ type: 'mobile' as NumberCategory, suffix: '' }],
    };
    setFormData(emptyForm);
    setInitialFormData(JSON.parse(JSON.stringify(emptyForm)));
    setNameError(null);
    setNumberErrors([]);
    setEditingIndex(null);
    setOpenModal(true);
  };

  const handleStartEdit = (index: number) => {
    const item = hotlines[index];
    if (!item) return;
    const entries = parseNumberEntries(item.number);
    const formState = {
      name: item.name,
      icon: item.icon || 'phone',
      entries: entries.length > 0 ? entries : [{ type: 'mobile' as NumberCategory, suffix: '' }],
    };
    setFormData(formState);
    setInitialFormData(JSON.parse(JSON.stringify(formState)));
    setNameError(null);
    setNumberErrors([]);
    setEditingIndex(index);
    setOpenModal(true);
  };

  const checkHasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleCloseModal = () => {
    if (checkHasChanges()) {
      confirm({
        title: 'Discard Changes?',
        description: 'You have unsaved changes in this hotline. Are you sure you want to discard them?',
        tone: 'warning',
        confirmLabel: 'Discard Changes',
        onConfirm: () => setOpenModal(false),
      });
    } else {
      setOpenModal(false);
    }
  };

  const handleNumberTypeChange = (entryIdx: number, type: NumberCategory) => {
    const newEntries = [...formData.entries];
    const sanitized = sanitizeNumberInput(newEntries[entryIdx].suffix, type);
    newEntries[entryIdx] = { type, suffix: sanitized };
    setFormData((prev) => ({ ...prev, entries: newEntries }));

    const updatedErrors = [...numberErrors];
    updatedErrors[entryIdx] = validateEntryNumber(newEntries[entryIdx], entryIdx === 0) || undefined;
    setNumberErrors(updatedErrors);
  };

  const handleNumberSuffixChange = (entryIdx: number, rawVal: string) => {
    const newEntries = [...formData.entries];
    const sanitized = sanitizeNumberInput(rawVal, newEntries[entryIdx].type);
    newEntries[entryIdx] = { ...newEntries[entryIdx], suffix: sanitized };
    setFormData((prev) => ({ ...prev, entries: newEntries }));

    const updatedErrors = [...numberErrors];
    updatedErrors[entryIdx] = validateEntryNumber(newEntries[entryIdx], entryIdx === 0) || undefined;
    setNumberErrors(updatedErrors);
  };

  const handleAddNumberEntry = () => {
    if (formData.entries.length >= 3) return;
    const existingTypes = new Set(formData.entries.map((e) => e.type));
    let nextType: NumberCategory = 'mobile';
    if (!existingTypes.has('mobile')) nextType = 'mobile';
    else if (!existingTypes.has('landline')) nextType = 'landline';
    else if (!existingTypes.has('short')) nextType = 'short';

    setFormData((prev) => ({
      ...prev,
      entries: [...prev.entries, { type: nextType, suffix: '' }],
    }));
  };

  const handleRemoveNumberEntry = (entryIdx: number) => {
    if (formData.entries.length <= 1) return;
    const newEntries = formData.entries.filter((_, i) => i !== entryIdx);
    setFormData((prev) => ({ ...prev, entries: newEntries }));
    setNumberErrors((prev) => prev.filter((_, i) => i !== entryIdx));
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate Name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setNameError('Department or agency name is required.');
      isValid = false;
    } else if (trimmedName.length < MIN_NAME_LENGTH) {
      setNameError(`Name must be at least ${MIN_NAME_LENGTH} characters.`);
      isValid = false;
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      setNameError(`Name cannot exceed ${MAX_NAME_LENGTH} characters.`);
      isValid = false;
    } else {
      setNameError(null);
    }

    // Validate Numbers
    const errorsList: (string | undefined)[] = formData.entries.map((entry, idx) => {
      const isPrimary = idx === 0;
      const err = validateEntryNumber(entry, isPrimary);
      if (err) isValid = false;
      return err || undefined;
    });

    setNumberErrors(errorsList);

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showFeedback({
        variant: 'error',
        title: 'Validation Error',
        description: 'Please correct the highlighted fields before saving.',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const serializedNumbers = formData.entries
        .map((e) => buildFullNumber(e.suffix, e.type))
        .filter(Boolean)
        .join('\n');

      const cleanedItem: HotlineItem = {
        name: formData.name.trim(),
        icon: formData.icon,
        number: serializedNumbers,
      };

      const updatedList = [...hotlines];
      if (editingIndex !== null) {
        updatedList[editingIndex] = cleanedItem;
      } else {
        updatedList.push(cleanedItem);
      }

      await settingsService.updateSettings({
        'content.emergencyHotlines': JSON.stringify(updatedList),
      });

      updateSettingLocal('emergencyHotlines', '', updatedList);
      if (refreshSettings) await refreshSettings();

      setHotlines(updatedList);
      setOpenModal(false);
      showFeedback({
        variant: 'success',
        title: editingIndex !== null ? 'Hotline Updated' : 'Hotline Created',
        description: `"${cleanedItem.name}" has been published to the emergency directory.`,
      });
    } catch (error) {
      console.error('Save failed:', error);
      showFeedback({
        variant: 'error',
        title: 'Save Failed',
        description: 'Failed to save emergency hotline. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHotline = (index: number) => {
    const target = hotlines[index];
    if (!target) return;

    confirm({
      title: 'Delete Hotline?',
      description: `Are you sure you want to delete "${target.name}"? This contact will no longer be visible to residents in emergencies.`,
      tone: 'danger',
      confirmLabel: 'Delete Hotline',
      onConfirm: async () => {
        try {
          const updated = hotlines.filter((_, i) => i !== index);
          await settingsService.updateSettings({
            'content.emergencyHotlines': JSON.stringify(updated),
          });
          updateSettingLocal('emergencyHotlines', '', updated);
          if (refreshSettings) await refreshSettings();
          setHotlines(updated);
          showFeedback({
            variant: 'success',
            title: 'Hotline Deleted',
            description: `"${target.name}" has been removed from the emergency directory.`,
          });
        } catch (error) {
          console.error('Delete failed:', error);
          showFeedback({
            variant: 'error',
            title: 'Delete Failed',
            description: 'Could not remove the hotline. Please try again.',
          });
        }
      },
    });
  };

  const getCategoryInfo = (iconName: string) => {
    switch (iconName) {
      case 'police':
        return {
          label: 'Police & Security',
          tone: 'sky' as const,
          Icon: Shield,
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-200',
        };
      case 'fire':
        return {
          label: 'Fire & Rescue',
          tone: 'rose' as const,
          Icon: Flame,
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
        };
      case 'ambulance':
        return {
          label: 'Medical & Health',
          tone: 'emerald' as const,
          Icon: Ambulance,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        };
      default:
        return {
          label: 'General Response',
          tone: 'slate' as const,
          Icon: Phone,
          iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
        };
    }
  };

  // Filtered dataset for DataTable
  const filteredHotlines = useMemo(() => {
    return hotlines
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((row) => {
        if (filterValues.search?.trim()) {
          const q = filterValues.search.trim().toLowerCase();
          const matchesName = row.name.toLowerCase().includes(q);
          const matchesNum = row.number.toLowerCase().includes(q);
          if (!matchesName && !matchesNum) return false;
        }
        if (filterValues.category && filterValues.category !== 'all') {
          if (row.icon !== filterValues.category) return false;
        }
        return true;
      });
  }, [hotlines, filterValues]);

  const columns: Column<HotlineItem & { originalIndex: number }>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'DEPARTMENT / AGENCY',
        render: (row) => (
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">{row.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">24/7 Community Emergency Assistance</div>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'CATEGORY',
        width: '180px',
        render: (row) => {
          const cat = getCategoryInfo(row.icon);
          return (
            <span className="text-sm text-slate-700 font-medium">
              {cat.label}
            </span>
          );
        },
      },
      {
        key: 'type',
        header: 'TYPE',
        width: '160px',
        render: (row) => {
          const nums = (row.number || '')
            .split('\n')
            .map((n) => n.trim())
            .filter(Boolean);

          const types = Array.from(new Set(nums.map((n) => detectCategory(n))));
          if (types.length === 0) {
            return <span className="text-sm text-slate-400 italic">—</span>;
          }

          const labels = types.map((t) =>
            t === 'short' ? 'Short Code' : t === 'mobile' ? 'Mobile' : 'Hotline'
          );

          return (
            <span className="text-sm text-slate-700 font-medium">
              {labels.join(', ')}
            </span>
          );
        },
      },
      {
        key: 'number',
        header: 'CONTACT NUMBERS',
        render: (row) => {
          const nums = (row.number || '')
            .split('\n')
            .map((n) => n.trim())
            .filter(Boolean);

          return (
            <div className="flex flex-wrap gap-1.5 items-center">
              {nums.map((n, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg tabular-nums"
                >
                  {n}
                </span>
              ))}
              {nums.length === 0 && <span className="text-xs text-slate-400 italic">None provided</span>}
            </div>
          );
        },
      },
    ],
    [hotlines]
  );

  const tableActions: RowAction<HotlineItem & { originalIndex: number }>[] = useMemo(
    () => [
      {
        id: 'edit',
        label: 'Edit Hotline',
        icon: Pencil,
        tone: 'primary',
        onClick: (row) => handleStartEdit(row.originalIndex),
      },
      {
        id: 'delete',
        label: 'Delete Hotline',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDeleteHotline(row.originalIndex),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Search',
        placeholder: 'Search department, agency, or contact number...',
      },
      {
        key: 'category',
        label: 'Category',
        options: [
          { label: 'All Categories', value: 'all' },
          { label: 'Police & Security', value: 'police' },
          { label: 'Fire & Rescue', value: 'fire' },
          { label: 'Medical & Ambulance', value: 'ambulance' },
          { label: 'General Response', value: 'phone' },
        ],
      },
    ],
    []
  );

  if (loading) {
    return <LoadingState message="Loading Emergency Hotlines Directory..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Hotlines"
        description="Configure 24/7 hotline numbers, emergency dispatch contacts, and community health response teams."
        actions={[
          {
            label: 'Add Hotline',
            icon: Plus,
            onClick: handleOpenNew,
          },
        ]}
      />

      <TableFilters
        filters={filterConfigs}
        values={filterValues}
        onApply={(applied) => setFilterValues(applied)}
        onClear={() => setFilterValues({ search: '', category: 'all' })}
      />

      <DataTable
        data={filteredHotlines}
        columns={columns}
        rowKey={(row) => `${row.originalIndex}-${row.name}`}
        actions={tableActions}
        pageSize={8}
        emptyTitle="No emergency hotlines found"
        emptyDescription={
          hotlines.length === 0
            ? 'Get started by creating emergency contacts for police, fire, or medical dispatch.'
            : 'No hotlines match your current search or category filter.'
        }
        emptyAction={
          hotlines.length === 0 ? (
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Hotline
            </button>
          ) : undefined
        }
      />

      {/* FormModal for Add / Edit */}
      <FormModal
        open={openModal}
        isOpen={openModal}
        onClose={handleCloseModal}
        title={editingIndex !== null ? 'Edit Emergency Hotline' : 'New Emergency Hotline'}
        subtitle="Configure 24/7 emergency dispatch details and direct telephone lines for residents."
        isSubmitting={isSubmitting}
        submitLabel={editingIndex !== null ? 'Save Changes' : 'Publish Hotline'}
        onSubmit={handleSubmit}
        size="lg"
      >
        <div className="space-y-6">
          <FormSection
            title="Department Information"
            description="Identify the responding agency or medical facility."
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department / Agency Name <span className="text-rose-500">*</span>
                </label>
                <CharCount
                  value={formData.name}
                  max={MAX_NAME_LENGTH}
                  min={MIN_NAME_LENGTH}
                />
              </div>
              <input
                type="text"
                value={formData.name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Barangay Health Center, PNP Substation"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                  nameError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              <FieldError error={nameError || undefined} />

              {/* Quick suggestions */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                {QUICK_DEPARTMENT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, name: preset }));
                      if (nameError) setNameError(null);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                      formData.name.trim() === preset
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Category"
            description="Select a category classification for this emergency responder."
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = formData.icon === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon: cat.id }))}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-medium text-xs ${
                      isSelected
                        ? cat.selectedBg + ' ring-2 ring-blue-500/20 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </FormSection>

          <FormSection
            title="Contact Numbers"
            description="Add primary and alternate telephone numbers (up to 3 numbers)."
          >
            <div className="space-y-3">
              {formData.entries.map((entry, idx) => {
                const isPrimary = idx === 0;
                const err = numberErrors[idx];

                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider">
                        {isPrimary ? 'Primary Hotline' : `Alternate Number #${idx}`}
                        {isPrimary && <span className="text-rose-500 ml-1">*</span>}
                      </span>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleRemoveNumberEntry(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={entry.type}
                        onChange={(e) => handleNumberTypeChange(idx, e.target.value as NumberCategory)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium shrink-0 cursor-pointer"
                      >
                        <option value="mobile">09 Mobile</option>
                        <option value="landline">(02) Landline</option>
                        <option value="short">Short Code</option>
                      </select>

                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={entry.suffix}
                          onChange={(e) => handleNumberSuffixChange(idx, e.target.value)}
                          placeholder={
                            entry.type === 'mobile'
                              ? 'e.g. 175558823 (9 digits)'
                              : entry.type === 'landline'
                              ? 'e.g. 82914567 (8 digits)'
                              : 'e.g. 911 (3-4 digits)'
                          }
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono ${
                            err ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Formatted live preview helper */}
                    {entry.suffix && (
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pl-1">
                        <span>Display preview:</span>
                        <strong className="text-slate-800 font-semibold">
                          {buildFullNumber(entry.suffix, entry.type)}
                        </strong>
                      </div>
                    )}

                    <FieldError error={err} />
                  </div>
                );
              })}

              {formData.entries.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddNumberEntry}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 text-blue-600 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Alternate Number ({formData.entries.length}/3)
                </button>
              )}
            </div>
          </FormSection>
        </div>
      </FormModal>

      {/* Global Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  );
};

export default EmergencyHotlinesPage;
