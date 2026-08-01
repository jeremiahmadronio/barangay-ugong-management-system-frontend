import { useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Tag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/table";
import { DetailsModal } from "@/components/ui";
import { DetailInfoCard } from "@/components/ui/details";
import { eventsService } from "@/config/api/events/events.service";
import type { EventResponse } from "@/config/api/events/events.types";

interface EventDetailsModalProps {
  open: boolean;
  event: EventResponse | null;
  onClose: () => void;
}

const statusToneMap: Record<string, "sky" | "emerald" | "rose" | "slate"> = {
  Upcoming: "sky",
  Ongoing: "emerald",
  Completed: "slate",
  Cancelled: "rose",
};

const formatDate = (event: EventResponse) => {
  const eventDate = event.eventDate || event.startDate;
  if (!eventDate) return event.time || "—";

  return new Date(eventDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (event: EventResponse) => event.time || "—";

interface MetaValueProps {
  icon: ElementType;
  children: ReactNode;
}

function MetaValue({ icon: Icon, children }: MetaValueProps) {
  return (
    <div className="inline-flex items-start gap-2 text-sm font-medium text-slate-700">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span className="break-words">{children}</span>
    </div>
  );
}

export function EventDetailsModal({
  open,
  event,
  onClose,
}: EventDetailsModalProps) {
  const [eventDetail, setEventDetail] = useState<EventResponse | null>(event);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !event) {
      setEventDetail(event);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setEventDetail(event);
    setError(null);
    setIsLoading(true);

    eventsService
      .getEventById(event.id)
      .then((data) => {
        if (isMounted) setEventDetail(data);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load full event details.",
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, event]);

  const detail = eventDetail;

  return (
    <DetailsModal
      open={open}
      title="Event Details"
      description="View the full schedule and program information for this community event."
      onClose={onClose}
    >
      {isLoading && !detail ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium">Loading event details...</p>
        </div>
      ) : detail ? (
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error}
            </div>
          )}

          <DetailInfoCard
            title="Program Overview"
            columns={3}
            fields={[
              { label: "Title", value: detail.title || "—" },
              {
                label: "Status",
                value: (
                  <Badge tone={statusToneMap[detail.status] || "slate"}>
                    {detail.status || "—"}
                  </Badge>
                ),
              },
              {
                label: "Date",
                value: (
                  <MetaValue icon={CalendarDays}>
                    {formatDate(detail)}
                  </MetaValue>
                ),
              },
              {
                label: "Time",
                value: (
                  <MetaValue icon={Clock3}>{formatTime(detail)}</MetaValue>
                ),
              },
              {
                label: "Location",
                value: (
                  <MetaValue icon={MapPin}>{detail.location || "—"}</MetaValue>
                ),
              },
              {
                label: "Category",
                value: detail.category ? (
                  <Badge
                    tone="violet"
                    className="px-3 py-1 text-xs font-semibold"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {detail.category}
                  </Badge>
                ) : (
                  "—"
                ),
              },
              {
                label: "Target Audience",
                value: detail.targetAudience ? (
                  <Badge tone="sky" className="px-3 py-1 text-xs font-semibold">
                    {detail.targetAudience}
                  </Badge>
                ) : (
                  "—"
                ),
              },
              {
                label: "Expected Attendees",
                value: (
                  <MetaValue icon={Users}>
                    {detail.expectedAttendees
                      ? `${detail.expectedAttendees} residents`
                      : "—"}
                  </MetaValue>
                ),
              },
              {
                label: "Organizer",
                value: (
                  <MetaValue icon={Building2}>
                    {detail.organizer || "—"}
                  </MetaValue>
                ),
              },
            ]}
          />

          <DetailInfoCard
            title="Program Description"
            columns={1}
            fields={[
              { label: "Description", value: detail.description || "—" },
            ]}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
          Unable to load event details.
        </div>
      )}
    </DetailsModal>
  );
}
