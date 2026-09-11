import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, User, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { Footer } from "./Footer";
import { announcementApi } from "@/cms-api/announcementApi";


export const AnnouncementDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementApi.getPublicAnnouncements();
        if (data && data.length > 0) {
          setAnnouncements(data);
        } else {
          setAnnouncements([]); 
        }
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

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading details...</div>;
    
    const announcement = announcements.find((a) => a.id.toString() === id);
    if (!announcement) return <Navigate to="/#announcements" replace />;

    const otherAnnouncements = announcements.filter((a) => a.id.toString() !== id);
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
    const mainImage = announcement.imageUrl ? `${baseUrl}${announcement.imageUrl}` : announcement.image;
    const allImages = [mainImage];
    if (announcement.additionalImages && Array.isArray(announcement.additionalImages)) {
      announcement.additionalImages.forEach((img: string) => {
        allImages.push(`${baseUrl}${img}`);
      });
    }

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    };

    return (
      <>
        {/* Header Banner */}
        <div 
          className="text-white py-16 lg:py-20"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-slate-400 font-medium mb-6 flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <Link to="/announcements" className="hover:text-white transition-colors">Announcements</Link>
              <span>›</span>
              <span className={`text-white px-2 py-0.5 rounded text-xs font-bold ${announcement.categoryColor || 'bg-blue-600'}`}>{announcement.category}</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-5 tracking-tight leading-tight max-w-4xl uppercase">{announcement.title}</h1>
          </div>
        </div>

        <motion.div 
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Left Content Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Metadata */}
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium border-b border-slate-200 pb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Published {announcement.date || (announcement.createdAt && new Date(announcement.createdAt).toLocaleDateString())}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{announcement.author || 'Barangay Admin'}</span>
                </div>
              </motion.div>

              {/* Featured Image / Carousel */}
              <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden shadow-md relative group h-[300px] sm:h-[400px] lg:h-[480px] w-full bg-slate-100">
                <AnimatePresence mode="popLayout">
                  <motion.img 
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    src={allImages[currentImageIndex]}
                    alt={`${announcement.title} - Image ${currentImageIndex + 1}`} 
                    className="w-full h-full object-cover absolute top-0 left-0"
                  />
                </AnimatePresence>
                
                {/* Carousel Controls */}
                  {allImages.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/80 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/80 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
                      </button>
                      
                      {/* Indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-blue-600' : 'bg-white/60 hover:bg-white/90'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
              </motion.div>

              {/* Text Content */}
              <motion.div variants={itemVariants} className="prose prose-slate max-w-none pt-4 space-y-6">
                {announcement.content ? (
                  // If from DB, we split by double newline or single newline
                  announcement.content
                    .replace(/<!-- SHOW_IN_CALENDAR:\s*(.*?)\s*-->/g, '')
                    .replace(/<!-- LOCATION:\s*(.*?)\s*-->/g, '')
                    .split('\n')
                    .map((paragraph: string, index: number) => (
                    paragraph.trim() !== '' && (
                      <p key={index} className="text-slate-600 leading-relaxed text-lg">
                        {paragraph}
                      </p>
                    )
                  ))
                ) : (
                  // Fallback to static paragraphs format
                  announcement.paragraphs && announcement.paragraphs.map((paragraph: string, index: number) => (
                    <p key={index} className="text-slate-600 leading-relaxed text-lg">
                      {paragraph}
                    </p>
                  ))
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="pt-10 border-t border-slate-200">
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to all announcements
                </Link>
              </motion.div>

            </div>

            {/* Right Sidebar */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm sticky top-28">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Other Announcements</h3>
                <ul className="space-y-6">
                  {otherAnnouncements.map((other) => (
                    <li key={other.id} className="group">
                      <p className="text-xs text-slate-400 mb-1">{other.date || (other.createdAt && new Date(other.createdAt).toLocaleDateString())}</p>
                      <Link 
                        to={`/announcements/${other.id}`}
                        className="block text-sm text-slate-800 font-bold group-hover:text-blue-600 transition-colors leading-snug uppercase"
                      >
                        {other.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
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
        className="flex-grow pt-24 pb-16"
      >
        {renderContent()}
      </motion.main>
      <Footer />
    </div>
  );
};

export default AnnouncementDetailsPage;
