import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { settingsService } from '@/config/api/cms/cms.service'
import {
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  FormModal,
  FormSection,
  LoadingState,
} from "@/components/ui";
import {
  DataTable,
  TableFilters,
  Badge,
  type BadgeTone,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from "@/components/ui/table";
import { useDialogs } from "@/hooks/useDialogs";

export type EventItem = {
  date: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
};

// Character and validation limits
const LIMITS = {
  title: { min: 3, max: 80 },
  location: { min: 3, max: 60 },
  description: { min: 10, max: 300 },
} as const;

const VENUE_SUGGESTIONS = [
  "Ugong Covered Court",
  "Barangay Multi-Purpose Hall",
  "Barangay Health Center",
  "Barangay Session Hall",
  "Barangay Plaza / Grounds",
  "Day Care Center",
];

const EVENT_TITLE_SUGGESTIONS = [
  "Barangay General Assembly",
  "Medical & Dental Mission",
  "Clean-Up Drive & Tree Planting",
  "Anti-Rabies Vaccination",
  "Feeding Program",
  "Disaster Preparedness Seminar",
];

// Date helpers
const todayStr = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toMinutes = (t: string): number => {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "TBD";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const format12HourTime = (time24: string): string => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let hour = parseInt(hStr, 10);
  const minute = mStr || "00";
  if (isNaN(hour)) return "";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
};

const getEventStatus = (
  dateStr: string
): { label: string; tone: BadgeTone } => {
  const today = todayStr();
  if (dateStr > today) return { label: "Upcoming", tone: "emerald" };
  if (dateStr === today) return { label: "Today", tone: "amber" };
  return { label: "Past Event", tone: "slate" };
};

function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const len = value?.length ?? 0;
  const isNear = len >= max * 0.85;
  const isOver = len > max;
  const isUnder = min !== undefined && len > 0 && len < min;

  return (
    <span
      className={`text-[11px] tabular-nums font-medium transition-colors ${
        isOver
          ? "text-rose-500 font-bold"
          : isUnder
          ? "text-amber-500"
          : isNear
          ? "text-amber-500"
          : "text-slate-400"
      }`}
    >
      {len}/{max}
    </span>
  );
}

export const UpcomingEventsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [eventsData, setEventsData] = useState<EventItem[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } = useDialogs();

  const [formData, setFormData] = useState<EventItem>({
    date: todayStr(),
    startTime: "08:00",
    endTime: "12:00",
    title: "",
    location: "",
    description: "",
  });

  const [initialFormData, setInitialFormData] = useState<EventItem>({
    date: todayStr(),
    startTime: "08:00",
    endTime: "12:00",
    title: "",
    location: "",
    description: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Filter state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: "",
    status: "all",
  });

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        placeholder: "Search event title, venue, or description...",
      },
      {
        key: "status",
        label: "Status",
        options: [
          { label: "All Events", value: "all" },
          { label: "Upcoming", value: "upcoming" },
          { label: "Past Events", value: "past" },
        ],
      },
    ],
    []
  );

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAllSettings();

      if (data["content.eventsData"]) {
        const parsed = JSON.parse(data["content.eventsData"]);
        setEventsData(Array.isArray(parsed) ? parsed : []);
      } else {
        const defaultEvents: EventItem[] = [
          {
            date: "2026-10-15",
            title: "Barangay General Assembly",
            description: "Reporting of the barangay budget, ongoing infrastructure projects, and disaster preparedness initiatives.",
            startTime: "09:00",
            endTime: "12:00",
            location: "Ugong Covered Court",
          },
          {
            date: "2026-10-22",
            title: "Free Medical & Dental Mission",
            description: "Free medical consultations, blood pressure screening, tooth extraction, and distribution of maintenance medicines.",
            startTime: "08:00",
            endTime: "17:00",
            location: "Barangay Health Center",
          },
        ];
        setEventsData(defaultEvents);
      }
    } catch (error) {
      console.error("Failed to load events data:", error);
      showFeedback({
        variant: "error",
        title: "Load Error",
        description: "Failed to load events data from server.",
      });
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Validation function
  const validateField = (field: string, value: string, allData: EventItem): string => {
    switch (field) {
      case "date": {
        if (!value) return "Event date is required.";
        const today = todayStr();
        if (value < today) return "Event date cannot be in the past.";
        return "";
      }
      case "startTime": {
        if (!value) return "Start time is required.";
        return "";
      }
      case "endTime": {
        if (!value) return "End time is required.";
        if (allData.startTime && toMinutes(value) <= toMinutes(allData.startTime)) {
          return "End time must be later than start time.";
        }
        return "";
      }
      case "title": {
        const trimmed = value.trim();
        if (!trimmed) return "Event title is required.";
        if (trimmed.length < LIMITS.title.min)
          return `Title must be at least ${LIMITS.title.min} characters.`;
        if (trimmed.length > LIMITS.title.max)
          return `Title cannot exceed ${LIMITS.title.max} characters.`;
        return "";
      }
      case "location": {
        const trimmed = value.trim();
        if (!trimmed) return "Venue/Location is required.";
        if (trimmed.length < LIMITS.location.min)
          return `Location must be at least ${LIMITS.location.min} characters.`;
        if (trimmed.length > LIMITS.location.max)
          return `Location cannot exceed ${LIMITS.location.max} characters.`;
        return "";
      }
      case "description": {
        const trimmed = value.trim();
        if (!trimmed) return "Description is required.";
        if (trimmed.length < LIMITS.description.min)
          return `Description must be at least ${LIMITS.description.min} characters.`;
        if (trimmed.length > LIMITS.description.max)
          return `Description cannot exceed ${LIMITS.description.max} characters.`;
        return "";
      }
      default:
        return "";
    }
  };

  const handleFieldChange = (field: keyof EventItem, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value, updated),
      ...(field === "startTime"
        ? { endTime: validateField("endTime", updated.endTime, updated) }
        : {}),
    }));
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {
      date: validateField("date", formData.date, formData),
      startTime: validateField("startTime", formData.startTime, formData),
      endTime: validateField("endTime", formData.endTime, formData),
      title: validateField("title", formData.title, formData),
      location: validateField("location", formData.location, formData),
      description: validateField("description", formData.description, formData),
    };

    setErrors(newErrors);
    setTouched({
      date: true,
      startTime: true,
      endTime: true,
      title: true,
      location: true,
      description: true,
    });

    return !Object.values(newErrors).some(Boolean);
  };

  const checkHasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const handleOpenNew = () => {
    const emptyForm: EventItem = {
      date: todayStr(),
      startTime: "08:00",
      endTime: "12:00",
      title: "",
      location: "",
      description: "",
    };
    setFormData(emptyForm);
    setInitialFormData(emptyForm);
    setErrors({});
    setTouched({});
    setEditingIndex(null);
    setOpenModal(true);
  };

  const handleStartEdit = (index: number) => {
    const item = eventsData[index];
    if (!item) return;
    setFormData({ ...item });
    setInitialFormData({ ...item });
    setErrors({});
    setTouched({});
    setEditingIndex(index);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (checkHasChanges()) {
      confirm({
        title: "Discard Changes?",
        description: "You have unsaved changes in this event. Are you sure you want to discard them?",
        tone: "warning",
        confirmLabel: "Discard Changes",
        onConfirm: () => setOpenModal(false),
      });
    } else {
      setOpenModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      showFeedback({
        variant: "error",
        title: "Validation Errors",
        description: "Please correct the highlighted fields before saving.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanedItem: EventItem = {
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        title: formData.title.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
      };

      const updatedList = [...eventsData];
      if (editingIndex !== null) {
        updatedList[editingIndex] = cleanedItem;
      } else {
        updatedList.push(cleanedItem);
      }

      // Sort chronologically by date and start time
      updatedList.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

      await settingsService.updateSettings({
        "content.eventsData": JSON.stringify(updatedList),
      });

      setEventsData(updatedList);
      setOpenModal(false);
      showFeedback({
        variant: "success",
        title: editingIndex !== null ? "Event Updated" : "Event Scheduled",
        description: `"${cleanedItem.title}" has been saved to the public calendar.`,
      });
    } catch (error) {
      console.error("Save failed:", error);
      showFeedback({
        variant: "error",
        title: "Save Failed",
        description: "Failed to save the event. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = (index: number) => {
    const targetTitle = eventsData[index]?.title || "this event";
    confirm({
      title: "Delete Event?",
      description: `Are you sure you want to permanently delete "${targetTitle}" from the public calendar?`,
      tone: "danger",
      confirmLabel: "Delete Event",
      onConfirm: async () => {
        try {
          const updated = eventsData.filter((_, i) => i !== index);
          await settingsService.updateSettings({
            "content.eventsData": JSON.stringify(updated),
          });
          setEventsData(updated);
          showFeedback({
            variant: "success",
            title: "Event Deleted",
            description: `"${targetTitle}" has been removed from scheduled events.`,
          });
        } catch (error) {
          console.error("Delete failed:", error);
          showFeedback({
            variant: "error",
            title: "Delete Failed",
            description: "Could not remove the event. Please try again.",
          });
        }
      },
    });
  };

  // Filtered dataset for DataTable
  const filteredEvents = useMemo(() => {
    const today = todayStr();
    return eventsData
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .filter((row) => {
        if (filterValues.search?.trim()) {
          const q = filterValues.search.trim().toLowerCase();
          const matchesTitle = row.title.toLowerCase().includes(q);
          const matchesLocation = row.location.toLowerCase().includes(q);
          const matchesDesc = row.description.toLowerCase().includes(q);
          if (!matchesTitle && !matchesLocation && !matchesDesc) return false;
        }
        if (filterValues.status && filterValues.status !== "all") {
          if (filterValues.status === "upcoming" && row.date < today) return false;
          if (filterValues.status === "past" && row.date >= today) return false;
        }
        return true;
      });
  }, [eventsData, filterValues]);

  const columns: Column<EventItem & { originalIndex: number }>[] = useMemo(
    () => [
      {
        key: "title",
        header: "EVENT DETAILS",
        render: (row) => (
          <div className="max-w-xs">
            <div className="font-semibold text-slate-900 text-sm">{row.title}</div>
            <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {row.description}
            </div>
          </div>
        ),
      },
      {
        key: "date",
        header: "DATE",
        render: (row) => (
          <span className="text-sm font-medium text-slate-800">
            {formatDateDisplay(row.date)}
          </span>
        ),
      },
      {
        key: "time",
        header: "TIME",
        render: (row) => {
          const start = format12HourTime(row.startTime);
          const end = format12HourTime(row.endTime);
          return (
            <span className="text-xs font-medium text-slate-600">
              {start && end ? `${start} – ${end}` : start || end || "TBD"}
            </span>
          );
        },
      },
      {
        key: "location",
        header: "VENUE / LOCATION",
        render: (row) => (
          <span className="text-xs font-medium text-slate-700">
            {row.location}
          </span>
        ),
      },
      {
        key: "status",
        header: "STATUS",
        render: (row) => {
          const status = getEventStatus(row.date);
          return (
            <Badge tone={status.tone}>
              {status.label}
            </Badge>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsData]
  );

  const tableActions: RowAction<EventItem & { originalIndex: number }>[] = useMemo(
    () => [
      {
        id: 'edit',
        label: 'Edit Event',
        icon: Pencil,
        tone: 'primary',
        onClick: (row) => handleStartEdit(row.originalIndex),
      },
      {
        id: 'delete',
        label: 'Delete Event',
        icon: Trash2,
        tone: 'danger',
        onClick: (row) => handleDeleteEvent(row.originalIndex),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const inputClass = (field: string) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors ${
      touched[field] && errors[field]
        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    }`;

  const FieldError = ({ field }: { field: string }) => {
    if (!touched[field] || !errors[field]) return null;
    return <p className="text-xs text-rose-500 mt-1 font-medium">{errors[field]}</p>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Events Management"
        description="Schedule, configure, and publish community assemblies, medical missions, and events for the public calendar."
        actions={[
          {
            label: "Add Event",
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
        onClear={() => setFilterValues({ search: "", status: "all" })}
      />

      {/* Data Table */}
      {loading ? (
        <LoadingState message="Loading events..." />
      ) : (
        <DataTable
          data={filteredEvents}
          columns={columns}
          rowKey={(row) => `${row.date}-${row.title}-${row.originalIndex}`}
          actions={tableActions}
          pageSize={7}
          emptyTitle="No scheduled events found"
          emptyDescription="No events match your current filter criteria. Click 'Add Event' above to create one."
        />
      )}

      {/* Unified Form Modal with Validation */}
      <FormModal
        open={openModal}
        title={editingIndex !== null ? "Edit Scheduled Event" : "Add New Scheduled Event"}
        submitLabel={
          isSubmitting
            ? "Saving..."
            : editingIndex !== null
            ? "Save Changes"
            : "Schedule Event"
        }
        isSubmitting={isSubmitting}
        maxWidthClass="max-w-2xl"
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          <FormSection title="Schedule & Timing">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  className={inputClass("date")}
                  value={formData.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                />
                <FieldError field="date" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  className={inputClass("startTime")}
                  value={formData.startTime}
                  onChange={(e) => handleFieldChange("startTime", e.target.value)}
                />
                <FieldError field="startTime" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  End Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  className={inputClass("endTime")}
                  value={formData.endTime}
                  onChange={(e) => handleFieldChange("endTime", e.target.value)}
                />
                <FieldError field="endTime" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Event Details">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <CharCount
                    value={formData.title}
                    max={LIMITS.title.max}
                    min={LIMITS.title.min}
                  />
                </div>
                <input
                  type="text"
                  maxLength={LIMITS.title.max}
                  placeholder="e.g. Free Medical & Dental Mission"
                  className={inputClass("title")}
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                />

                {/* Quick Event Title Suggestions */}
                <div className="mt-2 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Suggestions:</span>
                  {EVENT_TITLE_SUGGESTIONS.map((title) => {
                    const isSelected = formData.title === title;
                    return (
                      <button
                        key={title}
                        type="button"
                        onClick={() => handleFieldChange("title", title)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {title}
                      </button>
                    );
                  })}
                </div>

                <FieldError field="title" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Venue / Location <span className="text-rose-500">*</span>
                  </label>
                  <CharCount
                    value={formData.location}
                    max={LIMITS.location.max}
                    min={LIMITS.location.min}
                  />
                </div>
                <input
                  type="text"
                  maxLength={LIMITS.location.max}
                  placeholder="e.g. Barangay Health Center, Ground Floor"
                  className={inputClass("location")}
                  value={formData.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                />

                {/* Quick Venue Suggestions */}
                <div className="mt-2 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Suggestions:</span>
                  {VENUE_SUGGESTIONS.map((venue) => {
                    const isSelected = formData.location === venue;
                    return (
                      <button
                        key={venue}
                        type="button"
                        onClick={() => handleFieldChange("location", venue)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {venue}
                      </button>
                    );
                  })}
                </div>

                <FieldError field="location" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <CharCount
                    value={formData.description}
                    max={LIMITS.description.max}
                    min={LIMITS.description.min}
                  />
                </div>
                <textarea
                  rows={3}
                  maxLength={LIMITS.description.max}
                  placeholder="Provide details about who is invited, required items or documents to bring, and planned activities..."
                  className={`${inputClass("description")} resize-none`}
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                />
                <FieldError field="description" />
              </div>
            </div>
          </FormSection>
        </div>
      </FormModal>

      {/* Confirmation & Feedback Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
    </div>
  );
};

export default UpcomingEventsManagement;
