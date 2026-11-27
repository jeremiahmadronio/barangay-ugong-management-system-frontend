import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Footer } from "./Footer";
import { EditableText } from "@/components/EditableText";
import { announcementApi } from "@/config/api/cms/announcementApi";


export const AllAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const announcementsData = await announcementApi.getPublicAnnouncements();
        if (announcementsData && announcementsData.length > 0) {
          setAnnouncements(announcementsData);
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    document.title = "Barangay Announcements | Barangay Ugong";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Stay informed with the latest news, official notices, advisories, and program updates from Barangay Ugong, Valenzuela City.");
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://serbisyoko-3scbuvc-portal.com/announcements");
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://serbisyoko-3scbuvc-portal.com/announcements');
      document.head.appendChild(canonical);
    }
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow pt-20"
      >
        
        <div
          className="text-white py-16 lg:py-20"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-white/50 font-medium mb-6 flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <span className="text-white">Announcements</span>
            </div>
            <h1 className="text-4xl lg
            :text-5xl font-bold mb-4 tracking-tight">Announcements</h1>
            <EditableText
              as="div"
              section="sectionHeaders"
              settingKey="announcementsSubtitle"
              defaultText="Official notices, advisories, and program updates published by Barangay Ugong."
              className="text-base text-white/60 max-w-2xl leading-relaxed whitespace-pre-wrap inline-block"
              multiline
            />
          </div>
        </div>

        {/* Grid Layout */}
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No Announcements At This Time</h3>
                <p className="text-slate-400 text-sm">Please check back later for official notices.</p>
              </div>
            ) : (
              announcements.map((announcement, index) => {
                const coverImageUrl = announcement.imageUrl
                  ? `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")}${announcement.imageUrl}`
                  : null;

                const displayDate = announcement.date
                  || (announcement.createdAt && new Date(announcement.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }));

                return (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.07 }}
                  >
                    <Link
                      to={`/announcements/${announcement.id}`}
                      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300"
                    >
                      {/* Image — 16:9 landscape, top-anchored so banner text/focus stays visible */}
                      <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                        {coverImageUrl ? (
                          <img
                            src={coverImageUrl}
                            alt={announcement.title}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ background: 'linear-gradient(135deg, var(--theme-primary) 0%, #1e3a5f 100%)' }}
                          />
                        )}
                      </div>

                      {/* Text content — always visible, no hover reveal */}
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {announcement.category && (
                            <span className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'var(--theme-primary)' }}>
                              {announcement.category}
                            </span>
                          )}
                          {displayDate && (
                            <span className="text-[11px] text-slate-400">{displayDate}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-slate-600 transition-colors line-clamp-2">
                          {announcement.title}
                        </h3>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default AllAnnouncementsPage;

