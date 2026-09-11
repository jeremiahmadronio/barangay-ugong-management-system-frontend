import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneCall, ShieldAlert, Flame, Ambulance, X } from "lucide-react";
import { type EmergencyHotline } from "./landingPageData";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export const EmergencyHotlines = () => {
  const { settings } = useWebsiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const hotlines = settings.emergencyHotlines || [];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ambulance": return <Ambulance className="w-5 h-5" />;
      case "shield": return <ShieldAlert className="w-5 h-5" />;
      case "flame": return <Flame className="w-5 h-5" />;
      default: return <PhoneCall className="w-5 h-5" />;
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden"
          >
            <div className="bg-red-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Phone className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-lg">Emergency Hotlines</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-red-100 hover:text-white transition-colors p-1 rounded-full hover:bg-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {hotlines.map((hotline: EmergencyHotline, index: number) => (
                <a 
                  key={index}
                  href={`tel:${hotline.number.split('\n')[0].replace(/[^0-9]/g, '')}`}
                  className="flex items-start gap-4 p-3 hover:bg-red-50 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {getIcon(hotline.icon)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{hotline.name}</h4>
                    <p className="text-red-600 font-semibold text-sm whitespace-pre-line mt-0.5">
                      {hotline.number}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">Available 24/7 for immediate assistance</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-200/50 hover:bg-red-700 transition-colors relative"
        aria-label="Emergency Hotlines"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="phone"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Phone className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulsing ring effect */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75"></span>
        )}
      </motion.button>
    </div>
  );
};

export default EmergencyHotlines;
