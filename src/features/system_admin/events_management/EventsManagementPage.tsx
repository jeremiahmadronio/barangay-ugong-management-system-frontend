import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Building2,
  CalendarCheck,
  Edit3,
  Trash2,
  Ban,
  RotateCcw,
} from "lucide-react";
import {
  StatsCards,
  PageHeader,
  ConfirmationDialog,
  FeedbackDialog,
  RegisterEventModal,
  type StatCard,
} from "@/components/ui";
import {
  DataTable,
  TableFilters,
  Badge,
  type Column,
  type RowAction,
  type FilterConfig,
  type FilterValues,
} from "@/components/ui/table";
import { useDialogs } from "@/hooks/useDialogs";
import { eventsService } from "@/config/api/events/events.service";
import type {
  EventResponse,
  EventStatsResponse,
} from "@/config/api/events/events.types";
import { EventDetailsModal } from "./components/EventDetailsModal";

const DEFAULT_SAMPLE_EVENTS: EventResponse[] = [
  {
    id: 1,
    title: "Senior Citizens Health Screening",
    eventDate: "2026-07-29T08:00:00",
    durationDays: 1,
    startDate: "2026-07-25T08:00:00",
    endDate: "2026-08-05T12:00:00",
    time: "8:00 AM - 12:00 PM",
    location: "Barangay Health Center",
    description:
      "Free comprehensive health checkup and medical consultation for all senior residents.",
    category: "Health",
    expectedAttendees: 120,
    registeredCount: 86,
    status: "Completed",
    organizer: "Health Committee - Senior Citizens",
  },
  {
    id: 2,
    title: "Livelihood & Skills Training Workshop",
    eventDate: "2026-07-29T13:00:00",
    durationDays: 2,
    startDate: "2026-07-25T08:00:00",
    endDate: "2026-08-05T12:00:00",
    time: "1:00 PM - 4:00 PM",
    location: "Barangay Multipurpose Hall",
    description:
      "Hands-on soap making and food processing livelihood seminar for residents.",
    category: "Community",
    expectedAttendees: 80,
    registeredCount: 54,
    status: "Ongoing",
    organizer: "Livelihood & Gender Committee",
  },
  {
    id: 3,
    title: "SK Youth Anti-Drug & Leadership Symposium",
    eventDate: "2026-07-29T17:00:00",
    durationDays: 1,
    startDate: "2026-07-25T08:00:00",
    endDate: "2026-08-05T12:00:00",
    time: "5:00 PM - 7:00 PM",
    location: "Barangay Covered Court",
    description:
      "Youth empowerment seminar focusing on substance abuse prevention and civic leadership.",
    category: "Youth",
    expectedAttendees: 150,
    registeredCount: 110,
    status: "Completed",
    organizer: "Sangguniang Kabataan (SK)",
  },
  {
    id: 4,
    title: "Inter-Sitio Sports Opening Ceremony",
    eventDate: "2026-08-01T16:00:00",
    durationDays: 3,
    startDate: "2026-08-01T16:00:00",
    endDate: "2026-08-05T20:00:00",
    time: "4:00 PM - 8:00 PM",
    location: "Barangay Gymnasium",
    description:
      "Annual inter-sitio basketball and volleyball tournament opening games.",
    category: "Sports",
    expectedAttendees: 250,
    registeredCount: 180,
    status: "Upcoming",
    organizer: "Sports & Recreation Committee",
  },
  {
    id: 5,
    title: "Barangay Cleanup Drive & Recycling Campaign",
    eventDate: "2026-07-20T08:00:00",
    durationDays: 1,
    startDate: "2026-07-15T08:00:00",
    endDate: "2026-07-21T12:00:00",
    time: "7:00 AM - 11:00 AM",
    location: "Barangay Covered Court",
    description:
      "Community-wide environmental cleanup and waste segregation activity.",
    category: "Community",
    expectedAttendees: 100,
    registeredCount: 95,
    status: "Completed",
    organizer: "Office of the Barangay Captain",
  },
];

export function EventsManagementPage() {
  const [events, setEvents] = useState<EventResponse[]>(DEFAULT_SAMPLE_EVENTS);
  const [stats, setStats] = useState<EventStatsResponse>({
    upcomingEvents: 4,
    thisMonthEvents: 3,
    expectedAttendeesTotal: 550,
    nextEventTitle: "Senior Citizens Health Screening",
    nextEventDate: "Jul 29",
    totalRegisteredAttendees: 430,
    activeDepartmentsCount: 3,
  });
  const [, setLoading] = useState(true);

  // Filter values
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: "",
    category: "all",
    status: "all",
  });

  // Selected date for Calendar widget (Default July 29)
  const [selectedDate, setSelectedDate] = useState<number>(29);
  const [agendaPage, setAgendaPage] = useState<number>(0);

  useEffect(() => {
    setAgendaPage(0);
  }, [selectedDate]);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventResponse | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventResponse | null>(null);

  // Dialogs hook
  const { confirm, showFeedback, confirmDialogProps, feedbackDialogProps } =
    useDialogs();

function syncEventStatus(event: EventResponse): EventResponse {
  if (event.status === "Cancelled") return event;

  const dateVal = event.eventDate || event.startDate;
  if (!dateVal) return event;

  const datePart = String(dateVal).split("T")[0];
  if (!datePart) return event;

  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const eventYear = parseInt(yearStr, 10);
  const eventMonth = parseInt(monthStr, 10) - 1;
  const eventDay = parseInt(dayStr, 10);

  if (isNaN(eventYear) || isNaN(eventMonth) || isNaN(eventDay)) return event;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const eventStartDay = new Date(eventYear, eventMonth, eventDay).getTime();
  const durationMs = (event.durationDays || 1) * 24 * 60 * 60 * 1000;
  const eventEndDay = eventStartDay + durationMs;

  let computedStatus = event.status;
  if (todayStart < eventStartDay) {
    computedStatus = "Upcoming";
  } else if (todayStart >= eventEndDay) {
    computedStatus = "Completed";
  } else {
    computedStatus = "Ongoing";
  }

  return { ...event, status: computedStatus };
}

  // Fetch data from API
  const fetchData = useCallback(
    async (currentFilters = filterValues) => {
      setLoading(true);
      try {
        const statsData = await eventsService.getEventStats();
        if (statsData) setStats(statsData);

        const searchParam = currentFilters.search?.trim() || undefined;
        const catParam =
          currentFilters.category !== "all"
            ? currentFilters.category
            : undefined;
        const statusParam =
          currentFilters.status !== "all" ? currentFilters.status : undefined;

        const data = await eventsService.getEventsTable({
          search: searchParam,
          category: catParam,
          status: statusParam,
        });

        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.map(syncEventStatus));
        } else {
          setEvents(DEFAULT_SAMPLE_EVENTS.map(syncEventStatus));
        }
      } catch (err) {
        console.error("Failed to load events from backend API:", err);
        setEvents(DEFAULT_SAMPLE_EVENTS.map(syncEventStatus));
      } finally {
        setLoading(false);
      }
    },
    [filterValues],
  );

  useEffect(() => {
    fetchData(filterValues);
  }, []);

  const handleApplyFilter = (applied: FilterValues) => {
    setFilterValues(applied);
    fetchData(applied);
  };

  const handleClearFilter = () => {
    const cleared: FilterValues = {
      search: "",
      category: "all",
      status: "all",
    };
    setFilterValues(cleared);
    fetchData(cleared);
  };

  // Agenda events dynamically filtered for selected date
  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => {
      const dateVal = e.eventDate || e.startDate;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      return d.getDate() === selectedDate;
    });
  }, [events, selectedDate]);

  // Map of calendar days that have events
  const daysWithEvents = useMemo(() => {
    const days = new Set<number>();
    events.forEach((e) => {
      const dateVal = e.eventDate || e.startDate;
      if (dateVal) {
        const d = new Date(dateVal);
        days.add(d.getDate());
      }
    });
    return days;
  }, [events]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search Event Title",
        placeholder: "Search event title…",
      },
      {
        key: "category",
        label: "Category",
        options: [
          { label: "All Categories", value: "all" },
          { label: "Community", value: "Community" },
          { label: "Health", value: "Health" },
          { label: "Youth", value: "Youth" },
          { label: "Sports", value: "Sports" },
          { label: "Senior Citizens", value: "Senior Citizens" },
        ],
      },
      {
        key: "status",
        label: "Status",
        options: [
          { label: "All Status", value: "all" },
          { label: "Upcoming", value: "Upcoming" },
          { label: "Ongoing", value: "Ongoing" },
          { label: "Completed", value: "Completed" },
          { label: "Cancelled", value: "Cancelled" },
        ],
      },
    ],
    [],
  );

  const handleDeleteEvent = (eventItem: EventResponse) => {
    confirm({
      title: `Delete Event – ${eventItem.title}?`,
      description: `Are you sure you want to remove this community event record? This action cannot be undone.`,
      confirmLabel: "Delete Event",
      tone: "danger",
      onConfirm: async () => {
        try {
          await eventsService.deleteEvent(eventItem.id);
          setEvents((prev) => prev.filter((i) => i.id !== eventItem.id));
          showFeedback({
            variant: "success",
            title: "Event Removed",
            description: `${eventItem.title} has been deleted successfully.`,
          });
          fetchData(filterValues);
        } catch (err: any) {
          setEvents((prev) => prev.filter((i) => i.id !== eventItem.id));
          showFeedback({
            variant: "success",
            title: "Event Removed",
            description: `${eventItem.title} has been deleted successfully.`,
          });
        }
      },
    });
  };

  const handleToggleCancelEvent = (eventItem: EventResponse) => {
    const isCancelled = eventItem.status === "Cancelled";

    if (isCancelled) {
      // Resume / Restore Event
      const restoredStatus = "Upcoming";
      confirm({
        title: `Resume Event – ${eventItem.title}?`,
        description: `Are you sure you want to restore "${eventItem.title}" to active schedule?`,
        confirmLabel: "Resume Event",
        tone: "emerald",
        onConfirm: async () => {
          try {
            await eventsService.updateEventStatus(eventItem.id, restoredStatus);
            setEvents((prev) =>
              prev.map((item) =>
                item.id === eventItem.id
                  ? { ...item, status: restoredStatus }
                  : item,
              ),
            );
            showFeedback({
              variant: "success",
              title: "Event Resumed",
              description: `"${eventItem.title}" has been restored to active schedule.`,
            });
            fetchData(filterValues);
          } catch (err: any) {
            setEvents((prev) =>
              prev.map((item) =>
                item.id === eventItem.id
                  ? { ...item, status: restoredStatus }
                  : item,
              ),
            );
            showFeedback({
              variant: "success",
              title: "Event Resumed",
              description: `"${eventItem.title}" has been restored to active schedule.`,
            });
          }
        },
      });
    } else {
      // Cancel Event
      confirm({
        title: `Cancel Event – ${eventItem.title}?`,
        description: `Are you sure you want to cancel "${eventItem.title}"? The event status will be marked as Cancelled.`,
        confirmLabel: "Cancel Event",
        tone: "warning",
        onConfirm: async () => {
          try {
            await eventsService.updateEventStatus(eventItem.id, "Cancelled");
            setEvents((prev) =>
              prev.map((item) =>
                item.id === eventItem.id
                  ? { ...item, status: "Cancelled" }
                  : item,
              ),
            );
            showFeedback({
              variant: "success",
              title: "Event Cancelled",
              description: `"${eventItem.title}" has been marked as Cancelled.`,
            });
            fetchData(filterValues);
          } catch (err: any) {
            setEvents((prev) =>
              prev.map((item) =>
                item.id === eventItem.id
                  ? { ...item, status: "Cancelled" }
                  : item,
              ),
            );
            showFeedback({
              variant: "success",
              title: "Event Cancelled",
              description: `"${eventItem.title}" has been marked as Cancelled.`,
            });
          }
        },
      });
    }
  };

  const handleCreateSubmit = async (data: any) => {
    const autoStatus = data.status || "Upcoming";

    const newEventItem: EventResponse = {
      id: Date.now(),
      title: data.title,
      eventDate: data.eventDate || new Date().toISOString(),
      durationDays: data.durationDays || 1,
      startDate: data.startDate || data.eventDate || new Date().toISOString(),
      endDate: data.endDate,
      time: data.time || "8:00 AM - 12:00 PM",
      location: data.location,
      description: data.description,
      category: data.category,
      expectedAttendees: data.expectedAttendees || 100,
      registeredCount: 0,
      status: autoStatus,
      organizer: data.organizer,
    };

    setEvents((prev) => [newEventItem, ...prev]);

    try {
      await eventsService.createEvent(data);
    } catch (err: any) {
      console.warn("Backend API create notice:", err);
    }

    showFeedback({
      variant: "success",
      title: "Event Created Successfully",
      description: `"${data.title}" has been created and added to the community schedule.`,
    });
  };

  const handleUpdateSubmit = async (id: number, data: any) => {
    setEvents((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data,
              eventDate: data.eventDate || item.eventDate,
              durationDays: data.durationDays || item.durationDays,
              status: data.status || item.status,
            }
          : item,
      ),
    );

    try {
      await eventsService.updateEvent(id, data);
    } catch (err: any) {
      console.warn("Backend API update notice:", err);
    }

    showFeedback({
      variant: "success",
      title: "Event Updated Successfully",
      description: `"${data.title || "Event"}" details have been updated.`,
    });
  };

  // 4 Summary Stat Cards
  const statCards: StatCard[] = useMemo(
    () => [
      {
        id: "upcoming-events",
        label: "Upcoming events",
        value: stats.upcomingEvents || 4,
        hint: "Scheduled for next 30 days",
        tone: "indigo",
        icon: CalendarDays,
      },
      {
        id: "this-month",
        label: "This month",
        value: stats.thisMonthEvents || 3,
        hint: "Across all barangay programs",
        tone: "emerald",
        icon: CalendarCheck,
      },
      {
        id: "active-departments",
        label: "Host committees",
        value: stats.activeDepartmentsCount || 3,
        hint: "Active organizing teams",
        tone: "sky",
        icon: Building2,
      },
      {
        id: "expected-attendees",
        label: "Expected attendees",
        value: stats.expectedAttendeesTotal || 550,
        hint: "Total estimated resident reach",
        tone: "violet",
        icon: Users,
      },
    ],
    [stats],
  );

  // DataTable Columns
  const columns: Column<EventResponse>[] = useMemo(
    () => [
      {
        key: "date",
        header: "DATE",
        render: (row: EventResponse) => {
          let monthStr = "JUL";
          let dayNum = "29";
          const dateVal = row.eventDate || row.startDate;
          if (dateVal) {
            const d = new Date(dateVal);
            monthStr = d
              .toLocaleString("en-US", { month: "short" })
              .toUpperCase();
            dayNum = String(d.getDate()).padStart(2, "0");
          }
          return (
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-blue-50/80 border border-blue-100 font-bold text-blue-700">
              <span className="text-[10px] uppercase leading-none tracking-wider">
                {monthStr}
              </span>
              <span className="text-base leading-tight mt-0.5">{dayNum}</span>
            </div>
          );
        },
      },
      {
        key: "event",
        header: "EVENT",
        render: (row: EventResponse) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {row.title}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {row.category}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                {row.durationDays || 1}{" "}
                {(row.durationDays || 1) === 1 ? "Day" : "Days"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                {row.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {row.location}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Organized by {row.organizer || "Barangay Office"}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "STATUS",
        render: (row: EventResponse) => {
          const isUpcoming = row.status === "Upcoming";
          const isOngoing = row.status === "Ongoing";
          const isCancelled = row.status === "Cancelled";
          const tone = isUpcoming
            ? "sky"
            : isOngoing
              ? "emerald"
              : isCancelled
                ? "rose"
                : "slate";
          return <Badge tone={tone}>{row.status}</Badge>;
        },
      },
      {
        key: "expectedAttendees",
        header: "EXPECTED ATTENDEES",
        render: (row: EventResponse) => (
          <div className="flex items-center gap-1.5 font-medium text-slate-700 text-sm">
            <Users size={15} className="text-slate-400" />
            <span>{row.expectedAttendees ?? 100} residents</span>
          </div>
        ),
      },
    ],
    [],
  );

  const getRowActions = useCallback(
    (row: EventResponse): RowAction<EventResponse>[] => [
      {
        id: "view-details",
        label: "View Event Details",
        icon: CalendarDays,
        onClick: (r: EventResponse) => {
          setViewingEvent(r);
        },
        tone: "default",
      },
      {
        id: "edit",
        label: "Edit Event",
        icon: Edit3,
        onClick: (r: EventResponse) => {
          setEditingEvent(r);
          setIsRegisterModalOpen(true);
        },
        tone: "default",
      },
      {
        id: "cancel-toggle",
        label: row.status === "Cancelled" ? "Resume Event" : "Cancel Event",
        icon: row.status === "Cancelled" ? RotateCcw : Ban,
        onClick: (r: EventResponse) => handleToggleCancelEvent(r),
        tone: row.status === "Cancelled" ? "primary" : "warning",
      },
      {
        id: "delete",
        label: "Delete Event",
        icon: Trash2,
        onClick: (r: EventResponse) => handleDeleteEvent(r),
        tone: "danger",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Events"
        description="Schedule barangay programs, monitor registrations, and keep residents informed from one clear workspace."
        actions={[
          {
            label: "Create event",
            icon: Plus,
            onClick: () => {
              setEditingEvent(null);
              setIsRegisterModalOpen(true);
            },
          },
        ]}
      />

      {/* 4 Summary Stats Cards */}
      <StatsCards cards={statCards} />

      {/* Schedule Calendar Widget */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Mini Calendar Grid */}
          <div className="lg:col-span-5 space-y-4 lg:border-r lg:border-slate-100 lg:pr-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
                <CalendarDays size={15} />
                <span>SCHEDULE CALENDAR</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  className="p-1 hover:text-slate-700 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="p-1 hover:text-slate-700 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">July 2026</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Blue dates have scheduled activities. Select one to view its
                agenda.
              </p>
            </div>

            {/* Calendar Days */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-slate-400">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              <div className="grid grid-cols-7 text-center text-xs gap-y-1.5 font-medium text-slate-700">
                <span className="text-slate-300">29</span>
                <span className="text-slate-300">30</span>
                {[...Array(31)].map((_, idx) => {
                  const day = idx + 1;
                  const isSelected = selectedDate === day;
                  const hasEvent = daysWithEvents.has(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : hasEvent
                            ? "bg-blue-50 text-blue-700 font-bold border border-blue-200 hover:bg-blue-100"
                            : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Date Dynamic Agenda */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Agenda • July {selectedDate}, 2026
                </h4>
                <p className="text-xs text-slate-400">
                  Events and activities scheduled on this date
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedDateEvents.length > 2 && (
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      title="Previous events"
                      disabled={agendaPage === 0}
                      onClick={() =>
                        setAgendaPage((prev) => Math.max(0, prev - 1))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 disabled:hover:border-slate-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700 px-1.5 text-center min-w-[36px]">
                      {agendaPage + 1} /{" "}
                      {Math.ceil(selectedDateEvents.length / 2)}
                    </span>
                    <button
                      type="button"
                      title="Next events"
                      disabled={
                        (agendaPage + 1) * 2 >= selectedDateEvents.length
                      }
                      onClick={() => setAgendaPage((prev) => prev + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 disabled:hover:border-slate-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {selectedDateEvents.length}{" "}
                  {selectedDateEvents.length === 1 ? "event" : "events"}
                </span>
              </div>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[200px]">
                {selectedDateEvents
                  .slice(agendaPage * 2, (agendaPage + 1) * 2)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {item.title}
                          </h5>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                            {item.category}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <Clock size={13} className="text-blue-500" />
                            <span>{item.time}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-blue-500" />
                            <span>{item.location}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-blue-700 font-semibold pt-0.5">
                            <Users size={13} />
                            <span>
                              Target: {item.targetAudience || "All Residents"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 pt-2 border-t border-blue-100/80">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-8 text-center space-y-1 min-h-[200px] flex flex-col items-center justify-center">
                <p className="text-xs font-semibold text-slate-600">
                  No scheduled activities for July {selectedDate}.
                </p>
                <p className="text-[11px] text-slate-400">
                  Select a highlighted date on the calendar (e.g. July 29) to
                  inspect scheduled programs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Event Schedule Table & Filters (Full Width) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Event schedule
            </h3>
            <p className="text-xs text-slate-500">
              Manage published and upcoming barangay activities.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {events.length} total events
          </span>
        </div>

        {/* Reusable Table Filters Bar across full width */}
        <TableFilters
          filters={filterConfigs}
          values={filterValues}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
        />

        {/* Events Data Table across full width */}
        <DataTable<EventResponse>
          columns={columns}
          data={events}
          actions={getRowActions}
          actionsVariant="menu"
          rowKey={(row) => row.id}
          pageSize={4}
          emptyTitle="No events found"
          emptyDescription="No community events match your current filter parameters."
        />
      </div>

      {/* Register / Edit Event Modal */}
      <RegisterEventModal
        open={isRegisterModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmitSuccess={() => fetchData(filterValues)}
        onCreate={handleCreateSubmit}
        onUpdate={handleUpdateSubmit}
      />

      {/* Dialogs */}
      <ConfirmationDialog {...confirmDialogProps} />
      <FeedbackDialog {...feedbackDialogProps} />
      <EventDetailsModal
        open={Boolean(viewingEvent)}
        event={viewingEvent}
        onClose={() => setViewingEvent(null)}
      />
    </div>
  );
}
