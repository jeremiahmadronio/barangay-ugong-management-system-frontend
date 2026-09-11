import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Footer } from "./Footer";
import { EditableText } from "@/components/EditableText";
import { announcementApi } from "@/cms-api/announcementApi";


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

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } },
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow pt-20"
      >
        {/* Header Banner */}
        <div 
          className="text-white py-16 lg:py-20"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-slate-400 font-medium mb-6 flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <span className="text-white">Announcements</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight">Announcements</h1>
            <EditableText 
              as="div"
              section="sectionHeaders"
              settingKey="announcementsSubtitle"
              defaultText="Official notices, advisories, and program updates published by Barangay Ugong."
              className="text-base text-slate-300 max-w-2xl leading-relaxed whitespace-pre-wrap inline-block"
              multiline
            />
          </div>
        </div>

        {/* Grid Layout */}
        <motion.div 
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-500">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Announcements At This Time</h3>
                <p className="text-slate-500">Please check back later for official notices.</p>
              </div>
            ) : (
              announcements.map((announcement, index) => (
              <motion.div 
                key={announcement.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
              >
                <Link
                  to={`/announcements/${announcement.id}`}
                  className="relative block h-[380px] lg:h-[420px] rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Background Image */}
                  <img
                    src={announcement.imageUrl ? `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")}${announcement.imageUrl}` : announcement.image}
                    alt={announcement.title}
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110"
                  />

                  {/* Blue overlay (visible by default, disappears on hover) */}
                  <div className="absolute inset-0 bg-blue-800/70 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0 z-10" />
                  
                  {/* Secondary blue overlay for extra monochromatic tint */}
                  <div className="absolute inset-0 bg-blue-600/40 mix-blend-color transition-opacity duration-500 group-hover:opacity-0 z-10" />

                  {/* Bottom Gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500 z-20" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex flex-col gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                        {announcement.date || (announcement.createdAt && new Date(announcement.createdAt).toLocaleDateString())}
                      </div>
                      <div className="text-[10px] text-white/80 uppercase tracking-widest">
                        {announcement.category}
                      </div>
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold text-white leading-snug drop-shadow-sm uppercase">
                      {announcement.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            )))}
          </div>
        </motion.div>
      </motion.main>
      <Footer />
    </div>
  );
};

export default AllAnnouncementsPage;
