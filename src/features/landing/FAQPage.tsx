import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "./Footer";
import { EditableText } from "@/components/EditableText";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export const FAQPage = () => {
  const { settings } = useWebsiteSettings();
  const faqData = settings.faqData;
  const [activeTab, setActiveTab] = useState("All");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const categories = ["All", ...Array.from(new Set(faqData.map(item => item.category)))];

  const filteredFaqs = activeTab === "All" 
    ? faqData 
    : faqData.filter(item => item.category === activeTab);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    document.title = "Frequently Asked Questions | Barangay Ugong";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Find answers to common questions about barangay services, requirements, and community programs in Barangay Ugong, Valenzuela City.");
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://serbisyoko-3scbuvc-portal.com/faq");
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://serbisyoko-3scbuvc-portal.com/faq');
      document.head.appendChild(canonical);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow pt-24 pb-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Frequently Asked Questions
            </h1>
            <EditableText
              as="div"
              section="sectionHeaders"
              settingKey="faqSubtitle"
              defaultText="Find answers to common questions about barangay services, requirements, and community programs."
              className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed inline-block"
              multiline
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === category
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-16">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openItems.includes(index);
              return (
                <div 
                  key={index} 
                  className={`border-b border-slate-100 last:border-0 transition-colors duration-300 ${isOpen ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                  >
                    <span className={`font-bold pr-4 transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-800'}`}>
                      {faq.question}
                    </span>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No questions found for this category.
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-blue-900 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-700 rounded-full blur-3xl opacity-30 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-800/50 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
              <EditableText
                as="div"
                section="sectionHeaders"
                settingKey="faqFooterSubtitle"
                defaultText="Can't find the answer you're looking for? Reach out to our team, and we'll be happy to help."
                className="text-blue-200 mb-6 max-w-md mx-auto inline-block"
                multiline
              />
              <Link 
                to="/contact"
                className="bg-white text-blue-900 hover:bg-slate-50 px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-500/30"
              >
                Contact Us
              </Link>
            </div>
          </div>

        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default FAQPage;
