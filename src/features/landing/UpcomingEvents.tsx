import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { ScrollReveal, HoverCard } from "./MotionWrappers";
import { EditableText } from "@/components/EditableText";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export const UpcomingEvents = () => {
  const { settings } = useWebsiteSettings();
  
  const formatMonth = (dateString: string) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  };

  const formatDay = (dateString: string) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("en-US", { day: "2-digit" });
  };

  const formatTimeRange = (start: string, end: string) => {
    const formatTime = (time: string) => {
      if (!time) return "";
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      if (h === 12 && minutes === "00") return "12:00 NN";
      return `${h12}:${minutes} ${ampm}`;
    };

    if (start && end) return `${formatTime(start)} – ${formatTime(end)}`;
    if (start) return `${formatTime(start)} onwards`;
    return "";
  };
  
  return (
    <section id="events" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 italic mb-4">
              Upcoming Events
            </h2>
            <div>
              <EditableText
                as="p"
                section="sectionHeaders"
                settingKey="eventsSubtitle"
                defaultText="Assemblies, missions, and community activities open to all residents of Barangay Ugong."
                className="text-lg text-slate-500 leading-relaxed inline-block"
              />
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {settings.eventsData.map((event, index) => (
            <ScrollReveal key={`${event.date}-${index}`} delay={index * 0.12}>
              <HoverCard className="h-full">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-5 h-full hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white" style={{ backgroundColor: 'var(--theme-accent)' }}>
                    <span className="text-[10px] font-bold tracking-wider uppercase leading-none">{formatMonth(event.date)}</span>
                    <span className="text-2xl font-extrabold leading-none mt-0.5">{formatDay(event.date)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">{event.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">{event.description}</p>
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimeRange(event.startTime, event.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              </HoverCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="text-center mt-12">
            <Link to="/events" className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-slate-300 text-slate-700 font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors">
              View Full Calendar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default UpcomingEvents;
