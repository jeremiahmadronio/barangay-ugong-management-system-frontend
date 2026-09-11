import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Maps from './Maps';
import { Footer } from './Footer';

const MapsPage = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow pt-24 pb-16"
      >
        <Maps key={location.key} />
      </motion.main>
      <Footer />
    </div>
  );
};

export default MapsPage;