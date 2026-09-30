import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, MessageCircle, Search, HelpCircle, ChevronDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "./Footer";
import { EditableText } from "@/components/EditableText";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { faqData as fallbackFaqs } from "./landingPageData";

export const FAQPage = () => {
  const { settings } = useWebsiteSettings();

  const allFaqs = useMemo(() => {
    if (Array.isArray(settings?.faqData) && settings.faqData.length > 0) {
      return settings.faqData;
    }
    return fallbackFaqs;
  }, [settings?.faqData]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  // Extract unique categories safely
  const categories = useMemo(() => {
    const set = new Set<string>();
    allFaqs.forEach((item) => {
      const c = item.category?.trim();
      if (c) set.add(c);
    });
    return ["All", ...Array.from(set)];
  }, [allFaqs]);

  // Filter based on activeCategory and searchQuery
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFaqs.filter((item) => {
      const matchesCategory =
        activeCategory === "All" ||
        item.category?.trim().toLowerCase() === activeCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!q) return true;
      const questionMatch = item.question?.toLowerCase().includes(q);
      const answerMatch = item.answer?.toLowerCase().includes(q);
      const categoryMatch = item.category?.toLowerCase().includes(q);
      return questionMatch || answerMatch || categoryMatch;
    });
  }, [allFaqs, activeCategory, searchQuery]);

  const toggleQuestion = (question: string) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(question)) {
        next.delete(question);
      } else {
        next.add(question);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setOpenQuestions(new Set(filteredFaqs.map((f) => f.question)));
  };

  const handleCollapseAll = () => {
    setOpenQuestions(new Set());
  };

  useEffect(() => {
    document.title = "Frequently Asked Questions | Barangay Ugong";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Find answers to common questions about barangay services, requirements, clearances, and community programs in Barangay Ugong, Valenzuela City."
      );
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://serbisyoko-3scbuvc-portal.com/faq");
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", "https://serbisyoko-3scbuvc-portal.com/faq");
      document.head.appendChild(canonical);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow pt-28 pb-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              Resident Help Desk
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Frequently Asked Questions
            </h1>
            <EditableText
              as="div"
              section="sectionHeaders"
              settingKey="faqSubtitle"
              defaultText="Find quick, verified answers about barangay clearances, citizen services, schedules, and community guidelines."
              className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed inline-block"
              multiline
            />
          </div>

          {/* Interactive Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords (e.g. clearance, ID, fees, hours)..."
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 shadow-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Action bar (count + expand/collapse all) */}
          <div className="flex justify-between items-center px-1 mb-4 text-xs text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-800">{filteredFaqs.length}</strong>{" "}
              {filteredFaqs.length === 1 ? "question" : "questions"}
              {searchQuery && (
                <span>
                  {" "}
                  matching "<span className="text-blue-600 font-semibold">{searchQuery}</span>"
                </span>
              )}
            </span>

            {filteredFaqs.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Expand all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>

          {/* FAQ Accordion List */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden mb-16 divide-y divide-slate-100">
            {filteredFaqs.map((faq) => {
              const isOpen = openQuestions.has(faq.question);

              return (
                <div
                  key={faq.question}
                  className={`transition-colors duration-200 ${
                    isOpen ? "bg-slate-50/60" : "hover:bg-slate-50/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(faq.question)}
                    className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start sm:items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                          {faq.category || "General"}
                        </span>
                      </div>
                      <span
                        className={`text-sm sm:text-base font-bold transition-colors block ${
                          isOpen ? "text-blue-700" : "text-slate-900"
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>

                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isOpen
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border-t border-slate-100/60">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-12 text-center">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No questions found</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? `No questions matching "${searchQuery}". Try different keywords or browse by category.`
                    : "No questions currently published under this category."}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("All");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-center shadow-md relative overflow-hidden border border-slate-800">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Still have questions?</h3>
              <EditableText
                as="div"
                section="sectionHeaders"
                settingKey="faqFooterSubtitle"
                defaultText="Can't find the answer you're looking for? Reach out to our barangay staff and we'll gladly assist you."
                className="text-sm sm:text-base text-slate-400 mb-6 max-w-md mx-auto inline-block"
                multiline
              />
              <Link
                to="/contact"
                className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-xl font-bold text-sm transition-all shadow-sm focus:ring-4 focus:ring-blue-500/30"
              >
                Contact Barangay Hall
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
