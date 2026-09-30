import { useState, useEffect, useRef } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, MapPin, Tag, Clock, Images, FileText } from "lucide-react";
import { Footer } from "./Footer";
import { announcementApi } from "@/cms-api/announcementApi";

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
        const data = await announcementApi.getPublicAnnouncements();
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
          className="relative text-white pt-24 pb-14 lg:pb-20 overflow-hidden"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          {mainImage && (
            <>
              <img
                src={mainImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-20 select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </>
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="text-sm text-slate-400 font-medium mb-5 flex items-center gap-2 flex-wrap">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <Link to="/announcements" className="hover:text-white transition-colors">Announcements</Link>
              <span>›</span>
              <span className={`text-white px-2 py-0.5 rounded text-xs font-bold ${announcement.categoryColor || 'bg-blue-600'}`}>
                {announcement.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-6 tracking-tight leading-tight max-w-4xl uppercase drop-shadow">
              {announcement.title}
            </h1>

            {/* Quick meta pills in header */}
            <div className="flex flex-wrap gap-2.5">
              {publishDate && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {publishDate}
                </span>
              )}
              {eventDate && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Event: {eventDate}
                </span>
              )}
              {calendarLocation && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {calendarLocation}
                </span>
              )}
              {allImages.length > 1 && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-3 py-1 rounded-full text-xs font-medium">
                  <Images className="w-3.5 h-3.5" />
                  {allImages.length} photos
                </span>
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

              {/* Info cards grid */}
              <motion.div variants={itemVariants} className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }}>
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Category</p>
                    <p className="text-sm font-semibold text-slate-800">{announcement.category || 'General'}</p>
                  </div>
                </div>

                {publishDate && (
                  <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Published</p>
                      <p className="text-sm font-semibold text-slate-800">{publishDate}</p>
                    </div>
                  </div>
                )}

                {eventDate && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Event Date</p>
                      <p className="text-sm font-semibold text-slate-800">{eventDate}</p>
                    </div>
                  </div>
                )}

                {calendarLocation && (
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-xs">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Location</p>
                      <p className="text-sm font-semibold text-slate-800">{calendarLocation}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Excerpt / Summary */}
              {announcement.excerpt && (
                <motion.div variants={itemVariants}
                  className="border-l-4 border-blue-500 bg-blue-50/60 rounded-r-xl px-5 py-4"
                >
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Summary
                  </p>
                  <p className="text-base font-medium text-slate-700 leading-relaxed italic">
                    {announcement.excerpt}
                  </p>
                </motion.div>
              )}

              {/* Image Carousel */}
              {allImages.length > 0 && (
                <motion.div variants={itemVariants}
                  className="rounded-2xl overflow-hidden shadow-md relative group h-[300px] sm:h-[420px] lg:h-[500px] w-full bg-slate-100"
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
                        <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
                      </button>
                      <button onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/80 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {allImages.map((_, idx) => (
                          <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === safeIndex ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Full Content */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3">
                  Full Details
                </h2>
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
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to all announcements
                </Link>
              </motion.div>
            </div>

            {/* ── Right Sidebar ── */}
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">

              {/* Announcement Info card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
                  Announcement Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Category</span>
                    <span className={`text-white text-xs font-bold px-2 py-0.5 rounded ${announcement.categoryColor || 'bg-blue-600'}`}>
                      {announcement.category}
                    </span>
                  </div>
                  {publishDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Published</span>
                      <span className="text-slate-700 font-semibold text-xs text-right">{publishDate}</span>
                    </div>
                  )}
                  {eventDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Event Date</span>
                      <span className="text-amber-600 font-semibold text-xs text-right">{eventDate}</span>
                    </div>
                  )}
                  {calendarLocation && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium flex-shrink-0">Location</span>
                      <span className="text-emerald-700 font-semibold text-xs text-right">{calendarLocation}</span>
                    </div>
                  )}
                  {allImages.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Photos</span>
                      <span className="text-slate-700 font-semibold text-xs">
                        {allImages.length} image{allImages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Announcements */}
              {otherAnnouncements.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs sticky top-28">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3 mb-5">
                    Other Announcements
                  </h3>
                  <ul className="space-y-5">
                    {otherAnnouncements.slice(0, 5).map((other) => {
                      const otherCover = other.imageUrl ? `${baseUrl}${other.imageUrl}` : null;
                      return (
                        <li key={other.id} className="group">
                          <Link to={`/announcements/${other.id}`} className="flex gap-3 items-start">
                            <div className="w-14 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                              {otherCover ? (
                                <img src={otherCover} alt={other.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: 'var(--theme-primary)' }}>
                                  <FileText className="w-4 h-4 text-white/60" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 mb-0.5">
                                {formatDate(other.date, other.createdAt)}
                              </p>
                              <p className="text-xs text-slate-800 font-bold group-hover:text-blue-600 transition-colors leading-snug uppercase line-clamp-2">
                                {other.title}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {otherAnnouncements.length > 5 && (
                    <Link to="/announcements"
                      className="mt-5 block text-xs font-semibold text-center text-blue-600 hover:underline"
                    >
                      View all announcements →
                    </Link>
                  )}
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
