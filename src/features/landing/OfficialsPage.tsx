import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Officials from './Officials';
import { Footer } from './Footer';
import { EditableText } from "@/components/EditableText";

const OfficialsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="min-h-screen bg-slate-50 pt-20"
      >
        <div className="text-white py-16" style={{ backgroundColor: 'var(--theme-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 font-medium tracking-wide">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Officials</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Barangay Officials</h1>
            <EditableText 
              as="div"
              section="sectionHeaders"
              settingKey="officialsSubtitle"
              defaultText="The elected and appointed officers of Barangay Ugong for the 2025–2028 term, arranged by the council structure they serve in."
              className="text-base text-slate-300 max-w-2xl leading-relaxed whitespace-pre-wrap inline-block"
              multiline
            />
          </div>
        </div>
        <Officials />
      </motion.main>
      <Footer />
    </div>
  );
};

export default OfficialsPage;
