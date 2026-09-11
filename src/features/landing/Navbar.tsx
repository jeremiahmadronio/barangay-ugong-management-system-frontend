import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Calendar, Search, FileText, Bell, MessageCircle } from "lucide-react";
import { faqData } from "./landingPageData";
import { serviceApi } from "@/cms-api/serviceApi";
import { announcementApi } from "@/cms-api/announcementApi";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [announcementsData, setAnnouncementsData] = useState<any[]>([]);
  const { settings } = useWebsiteSettings();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href.startsWith("/#") || href === "/") {
      return false;
    }
    return location.pathname === href;
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Fetch data for search
    const fetchData = async () => {
      try {
        const [servicesRes, announcementsRes] = await Promise.all([
          serviceApi.getPublicServices().catch(() => []),
          announcementApi.getPublicAnnouncements().catch(() => [])
        ]);
        setServicesData(Array.isArray(servicesRes) ? servicesRes : []);
        setAnnouncementsData(Array.isArray(announcementsRes) ? announcementsRes : []);
      } catch (error) {
        console.error("Failed to fetch search data", error);
      }
    };
    fetchData();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isSearchOpen, isMobileSearchOpen]);

  // Close search when navigating
  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname, location.hash]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/#about" },
    { label: "Services", href: "/#services" },
    { label: "Contact", href: "/#contact" },
    { label: "Announcements", href: "/announcements" },
    { label: "Officials", href: "/officials" },
    { label: "Map", href: "/map" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const getSearchResults = () => {
    if (!searchQuery.trim()) return { services: [], announcements: [], faqs: [] };
    const q = searchQuery.toLowerCase();

    return {
      services: servicesData.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)).slice(0, 2),
      announcements: announcementsData.filter(a => a.title.toLowerCase().includes(q)).slice(0, 2),
      faqs: faqData.filter(f => f.question.toLowerCase().includes(q)).slice(0, 2)
    };
  };

  const results = getSearchResults();
  const hasResults = results.services.length > 0 || results.announcements.length > 0 || results.faqs.length > 0;

  const renderSearchResultsDropdown = () => {
    if (!searchQuery.trim()) return null;

    return (
      <div className="absolute top-full right-0 mt-2 w-full lg:w-96 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {!hasResults ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <>
              {results.services.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Documents & Services</div>
                  {results.services.map(s => (
                    <Link key={s.id} to={`/services/${s.id}`} className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{s.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{s.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.announcements.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Announcements</div>
                  {results.announcements.map(a => (
                    <Link key={a.id} to={`/announcements/${a.id}`} className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group">
                      <div className="bg-orange-100 text-orange-600 p-2 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{a.title}</div>
                        <div className="text-xs text-slate-500">{a.date}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.faqs.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">FAQs</div>
                  {results.faqs.map((f, idx) => (
                    <Link key={idx} to="/faq" className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group">
                      <div className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{f.question}</div>
                        <div className="text-xs text-slate-500">{f.category}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className={`transition-all duration-300 ${isScrolled
            ? "shadow-xl border-b border-white/10 text-white"
            : isMobileSearchOpen
              ? "bg-white/95 backdrop-blur-md shadow-lg"
              : "bg-white/90 backdrop-blur-sm"
          }`}
        style={isScrolled ? { backgroundColor: 'var(--theme-primary)' } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 relative">

            {/* Logo area - hidden if mobile search is open */}
            <div className={`transition-opacity duration-200 ${isMobileSearchOpen ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
              <Link
                to="/"
                className="flex items-center gap-3"
                onClick={closeMobileMenu}
              >
                <img
                  src={settings.logoUrl}
                  alt="Barangay Ugong Logo"
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover bg-white"
                />
                <div className="hidden sm:block">
                  <h1 className={`font-extrabold text-sm lg:text-base leading-tight tracking-wide transition-colors ${isScrolled ? 'text-white' : 'text-slate-900'}`}>
                    BARANGAY UGONG
                  </h1>
                  <p className={`text-xs transition-colors ${isScrolled ? 'text-slate-300' : 'text-slate-500'}`}>Lungsod ng Valenzuela</p>
                </div>
              </Link>
            </div>

            {/* Mobile Search Overlay */}
            <div
              className={`lg:hidden absolute inset-0 flex items-center justify-between px-4 transition-all duration-300 ${isMobileSearchOpen ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'} ${!isScrolled ? 'bg-white' : ''}`}
              style={isScrolled ? { backgroundColor: 'var(--theme-primary)' } : {}}
            >
              <div className={`flex-1 flex items-center rounded-lg px-3 py-2 mr-2 ${isScrolled ? 'bg-black/20' : 'bg-slate-100'}`}>
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Search announcements..."
                  className={`w-full bg-transparent border-none outline-none text-sm ${isScrolled ? 'text-white placeholder:text-slate-400' : 'text-slate-900'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(""); }}
                className={`p-2 ${isScrolled ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <X className="w-6 h-6" />
              </button>
              {isMobileSearchOpen && renderSearchResultsDropdown()}
            </div>

            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-2 xl:px-3 py-2 text-[13px] xl:text-sm font-medium rounded-lg transition-colors ${isActive(link.href)
                      ? (isScrolled ? "bg-black/20 text-white" : "bg-blue-50 text-blue-600")
                      : (isScrolled ? "text-white/80 hover:text-white hover:bg-white/10" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50")
                    }`}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/events"
                className={`px-2 xl:px-3 py-2 text-[13px] xl:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${isActive("/events")
                    ? (isScrolled ? "bg-black/20 text-white" : "bg-blue-50 text-blue-600")
                    : (isScrolled ? "text-white/80 hover:text-white hover:bg-white/10" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50")
                  }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>
              <Link
                to="/faq"
                className={`px-2 xl:px-3 py-2 text-[13px] xl:text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${isActive("/faq")
                    ? (isScrolled ? "bg-black/20 text-white" : "bg-blue-50 text-blue-600")
                    : (isScrolled ? "text-white/80 hover:text-white hover:bg-white/10" : "text-slate-700 hover:text-blue-600 hover:bg-slate-50")
                  }`}
              >
                <MessageCircle className="w-4 h-4" />
                FAQs
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 xl:gap-3 relative">

              {/* Desktop Search Toggle */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) setSearchQuery("");
                }}
                className={`p-2 rounded-lg transition-colors ${isSearchOpen
                    ? (isScrolled ? 'bg-black/20 text-white' : 'bg-blue-50 text-blue-600')
                    : (isScrolled ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600')
                  }`}
                aria-label="Toggle search"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Desktop Search Popover */}
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-4 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="flex items-center w-full bg-slate-50 border-b border-slate-100 px-4 py-3">
                    <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search announcements, requirements..."
                      className="w-full bg-transparent border-none outline-none text-sm text-slate-900 placeholder:text-slate-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Reuse the inner logic of SearchResultsDropdown but inline to avoid absolute positioning conflicts */}
                  {searchQuery.trim() && (
                    <div className="max-h-[70vh] overflow-y-auto p-2 bg-white">
                      {!hasResults ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                          No results found for "{searchQuery}"
                        </div>
                      ) : (
                        <>
                          {results.services.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Documents & Services</div>
                              {results.services.map(s => (
                                <Link key={s.id} to={`/services/${s.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group">
                                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{s.title}</div>
                                    <div className="text-xs text-slate-500 line-clamp-1">{s.description}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}

                          {results.announcements.length > 0 && (
                            <div className="mb-2">
                              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Announcements</div>
                              {results.announcements.map(a => (
                                <Link key={a.id} to={`/announcements/${a.id}`} onClick={() => setIsSearchOpen(false)} className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group">
                                  <div className="bg-orange-100 text-orange-600 p-2 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Bell className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{a.title}</div>
                                    <div className="text-xs text-slate-500">{a.date}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}

                          {results.faqs.length > 0 && (
                            <div>
                              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">FAQs</div>
                              {results.faqs.map((f, idx) => (
                                <Link key={idx} to="/faq" onClick={() => setIsSearchOpen(false)} className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors group">
                                  <div className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{f.question}</div>
                                    <div className="text-xs text-slate-500">{f.category}</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Link
                to="/login"
                className="text-white hover:brightness-90 px-4 py-2.5 rounded-lg text-[13px] xl:text-sm font-bold transition-all shadow-sm whitespace-nowrap"
                style={{ backgroundColor: 'var(--theme-accent)' }}
              >
                Staff Login
              </Link>
            </div>

            {/* Mobile Search & Menu Toggles */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className={`p-2 transition-colors ${isScrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'} rounded-lg ${isMobileSearchOpen ? 'hidden' : 'block'}`}
              >
                <Search className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 transition-colors ${isScrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'} rounded-lg ${isMobileSearchOpen ? 'hidden' : 'block'}`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={closeMobileMenu}
                  className={`block px-4 py-3 rounded-lg transition-colors font-medium ${isActive(link.href)
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/events"
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${isActive("/events")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>
              <Link
                to="/faq"
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${isActive("/faq")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <MessageCircle className="w-4 h-4" />
                FAQs
              </Link>
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="block w-full mt-3 text-white hover:brightness-90 px-4 py-3 rounded-lg font-bold transition-all text-center"
                style={{ backgroundColor: 'var(--theme-accent)' }}
              >
                Login as Staff
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
