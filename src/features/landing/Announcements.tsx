import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Bell } from "lucide-react";
import { announcementService } from "@/config/api/cms/cms.service";
import { ScrollReveal } from "./MotionWrappers";

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementService.getPublicAnnouncements();
        setAnnouncements(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-64" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-xl" />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="announcements" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <ScrollReveal>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Updates</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Latest Announcements
              </h2>
            </div>
            <Link
              to="/announcements"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
              style={{ color: 'var(--theme-accent)' }}
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Cards */}
        {announcements.length === 0 ? (
          <ScrollReveal delay={0.1}>
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">No announcements at this time</p>
              <p className="text-xs text-slate-400 mt-1">Please check back later for updates.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((item, index) => {
              const dateStr = item.date || (item.createdAt && new Date(item.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }));
              const imageUrl = item.imageUrl
                ? `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")}${item.imageUrl}`
                : item.image;

              return (
                <ScrollReveal key={item.id} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all h-full flex flex-col"
                  >
                    {/* Image */}
                    {imageUrl && (
                      <div className="h-44 overflow-hidden bg-slate-100">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Date */}
                      {dateStr && (
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{dateStr}</p>
                      )}

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Excerpt */}
                      {item.excerpt && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 flex-1">
                          {item.excerpt}
                        </p>
                      )}

                      {/* Read more */}
                      <Link
                        to={`/announcements/${item.id}`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:underline w-fit"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        Read more
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* Mobile "View all" */}
        <div className="mt-8 sm:hidden">
          <Link
            to="/announcements"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
            style={{ color: 'var(--theme-accent)' }}
          >
            View all announcements
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Announcements;
