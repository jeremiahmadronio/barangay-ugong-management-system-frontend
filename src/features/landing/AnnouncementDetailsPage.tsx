import { useState, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Footer } from "./Footer";
import { announcementService } from "@/config/api/cms/cms.service";

export const AnnouncementDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const prevIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementService.getPublicAnnouncements();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch announcements", error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const formatDate = (raw?: string, createdAt?: string): string | null => {
    if (raw) return raw;
    if (createdAt) return new Date(createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    return null;
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mb-4" />
        <span className="text-sm font-medium">Loading announcement...</span>
      </div>
    );

    const announcement = announcements.find((a) => a.id.toString() === id);
    if (!announcement) return <Navigate to="/#announcements" replace />;

    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      if (currentImageIndex !== 0) setCurrentImageIndex(0);
    }

    const otherAnnouncements = announcements.filter((a) => a.id.toString() !== id);
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

    // Extract embedded calendar metadata from content
    let rawContent = announcement.content || '';
    let calendarDate = '';
    let calendarLocation = '';

    const dateMatch = rawContent.match(/<!-- SHOW_IN_CALENDAR:\s*(.*?)\s*-->/);
    if (dateMatch) {
      calendarDate = dateMatch[1];
      rawContent = rawContent.replace(dateMatch[0], '').trim();
    }
    const locMatch = rawContent.match(/<!-- LOCATION:\s*(.*?)\s*-->/);
    if (locMatch) {
      calendarLocation = locMatch[1];
      rawContent = rawContent.replace(locMatch[0], '').trim();
    }

    // Build image list
    const allImages: string[] = [];
    const mainImage = announcement.imageUrl
      ? `${baseUrl}${announcement.imageUrl}`
      : announcement.image || null;
    if (mainImage) allImages.push(mainImage);
    if (announcement.additionalImages && Array.isArray(announcement.additionalImages)) {
      announcement.additionalImages.forEach((img: string) => {
        if (img) allImages.push(`${baseUrl}${img}`);
      });
    }

    const safeIndex = Math.min(currentImageIndex, Math.max(0, allImages.length - 1));
    const nextImage = () => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));

    const publishDate = formatDate(announcement.date, announcement.createdAt);
    const eventDate = calendarDate
      ? new Date(calendarDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

    return (
      <>
        {/* ── Hero Header ── */}
        <div
          className="text-white pt-24 pb-14 lg:pb-20"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="text-sm text-white/50 mb-5 flex items-center gap-2 flex-wrap">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <Link to="/announcements" className="hover:text-white transition-colors">Announcements</Link>
              {announcement.category && (
                <>
                  <span>›</span>
                  <span className="text-white/70">{announcement.category}</span>
                </>
              )}
            </div>

            {/* Title — normal case, no uppercase, no gradient */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-5 leading-tight max-w-4xl text-white">
              {announcement.title}
            </h1>

            {/* Minimal meta line */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              {publishDate && <span>{publishDate}</span>}
              {calendarLocation && (
                <>
                  <span className="text-white/30">·</span>
                  <span>{calendarLocation}</span>
                </>
              )}
              {eventDate && (
                <>
                  <span className="text-white/30">·</span>
                  <span>Event: {eventDate}</span>
                </>
              )}
              {allImages.length > 1 && (
                <>
                  <span className="text-white/30">·</span>
                  <span>{allImages.length} photos</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left Content Column ── */}
            <div className="lg:col-span-2 space-y-8">

              {/* Image Carousel */}
              {allImages.length > 0 && (
                <motion.div variants={itemVariants}
                  className="rounded-xl overflow-hidden relative group h-[280px] sm:h-[400px] lg:h-[480px] w-full bg-slate-100"
                >
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={safeIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={allImages[safeIndex]}
                      alt={`${announcement.title} - Image ${safeIndex + 1}`}
                      className="w-full h-full object-cover absolute top-0 left-0"
                    />
                  </AnimatePresence>

                  {allImages.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
                      {safeIndex + 1} / {allImages.length}
                    </div>
                  )}

                  {allImages.length > 1 && (
                    <>
                      <button onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/80 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <ChevronLeft className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <button onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/80 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <ChevronRight className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {allImages.map((_, idx) => (
                          <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === safeIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}


              {/* Full Content */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="space-y-4">
                  {rawContent ? (
                    rawContent.split('\n').map((paragraph: string, index: number) =>
                      paragraph.trim() !== '' && (
                        <p key={index} className="text-slate-700 leading-relaxed text-base">
                          {paragraph}
                        </p>
                      )
                    )
                  ) : (
                    announcement.paragraphs?.map((paragraph: string, index: number) => (
                      <p key={index} className="text-slate-700 leading-relaxed text-base">
                        {paragraph}
                      </p>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Back button */}
              <motion.div variants={itemVariants} className="pt-6 border-t border-slate-200">
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                >
                  ← Back to all announcements
                </Link>
              </motion.div>
            </div>

            {/* ── Right Sidebar ── */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">

              {/* Announcement Info card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-400 font-medium tracking-wide mb-4 pb-3 border-b border-slate-100">
                  Announcement Info
                </p>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-slate-400">Category</span>
                    <span className="text-sm text-slate-700 font-medium text-right">
                      {announcement.category || 'General'}
                    </span>
                  </div>
                  {publishDate && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-slate-400">Published</span>
                      <span className="text-sm text-slate-700 font-medium text-right">{publishDate}</span>
                    </div>
                  )}
                  {eventDate && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-slate-400">Event Date</span>
                      <span className="text-sm text-slate-700 font-medium text-right">{eventDate}</span>
                    </div>
                  )}
                  {calendarLocation && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-slate-400">Location</span>
                      <span className="text-sm text-slate-700 font-medium text-right">{calendarLocation}</span>
                    </div>
                  )}
                  {allImages.length > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-400">Photos</span>
                      <span className="text-sm text-slate-700 font-medium">
                        {allImages.length} image{allImages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Announcements */}
              {otherAnnouncements.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 sticky top-28">
                  <p className="text-xs text-slate-400 font-medium tracking-wide mb-4 pb-3 border-b border-slate-100">
                    Other Announcements
                  </p>
                  <ul className="space-y-4">
                    {otherAnnouncements.slice(0, 2).map((other) => {
                      const otherCover = other.imageUrl ? `${baseUrl}${other.imageUrl}` : null;
                      return (
                        <li key={other.id}>
                          <Link to={`/announcements/${other.id}`} className="flex gap-3 items-start group">
                            <div className="w-14 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                              {otherCover ? (
                                <img src={otherCover} alt={other.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full"
                                  style={{ backgroundColor: 'var(--theme-primary)' }} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-400 mb-0.5">
                                {formatDate(other.date, other.createdAt)}
                              </p>
                              <p className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors leading-snug line-clamp-2">
                                {other.title}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <Link to="/announcements"
                    className="mt-4 block text-xs font-medium text-center text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    View all announcements →
                  </Link>
                </div>
              )}
            </motion.div>

          </div>
        </motion.div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow"
      >
        {renderContent()}
      </motion.main>
      <Footer />
    </div>
  );
};

export default AnnouncementDetailsPage;
