import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, Mail, ChevronUp, ExternalLink } from "lucide-react";
import {
  footerBranding,
  footerQuickLinks,
  footerDocumentTypes,
  footerContactInfo,
} from "./landingPageData";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { servicesService } from "@/config/api/cms/cms.service";
import { resolveAssetUrl } from "@/utils/assetUrl";

const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface FooterProps {
  onNavigate?: (section: string) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const { settings } = useWebsiteSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const [publicServices, setPublicServices] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    servicesService.getPublicServices()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setPublicServices(data);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, []);

  const branding = settings.footerBranding || footerBranding;
  const logoUrl = resolveAssetUrl(settings.logoUrl || branding.logoSrc, "/assets/ugong-logo.png");

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const sectionId = href.replace("/#", "");
      if (location.pathname === "/") {
        if (onNavigate) {
          onNavigate(sectionId);
        } else {
          const el = document.getElementById(sectionId);
          if (el) {
            const navbarOffset = 90;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }
        window.history.pushState(null, "", href);
      } else {
        navigate(`/#${sectionId}`, { state: { scrollTo: sectionId } });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const contactList = (settings.footerContactInfo && settings.footerContactInfo.length > 0)
    ? settings.footerContactInfo
    : footerContactInfo;

  const getContactIcon = (item: any, index: number) => {
    if (item.iconName === 'MapPin' || item.icon === MapPin) return MapPin;
    if (item.iconName === 'Phone' || item.icon === Phone) return Phone;
    if (item.iconName === 'Mail' || item.icon === Mail) return Mail;
    if (item.iconName === 'Clock' || item.icon === Clock) return Clock;

    // Content detection
    const text = (item?.text || '').toLowerCase();
    if (text.includes('@') || text.includes('.gov.ph') || text.includes('.com')) return Mail;
    if (text.includes('09') || text.includes('(02)') || text.includes('hotline') || text.includes('tel')) return Phone;
    if (text.includes('hall') || text.includes('st.') || text.includes('street') || text.includes('city') || text.includes('ugong')) return MapPin;
    if (text.includes('monday') || text.includes('am') || text.includes('pm') || text.includes('hours')) return Clock;

    // Index fallback
    if (index === 0) return MapPin;
    if (index === 1) return Phone;
    if (index === 2) return Mail;
    return Clock;
  };

  const resolveDocHref = (label: string, fallbackHref: string) => {
    if (publicServices.length > 0) {
      const cleanLabel = label.toLowerCase().replace(/barangay|certificate of|permit/g, '').trim();
      const matched = publicServices.find((s: any) => {
        const t = (s.title || '').toLowerCase();
        return t.includes(label.toLowerCase()) ||
          label.toLowerCase().includes(t) ||
          (cleanLabel.length > 3 && t.includes(cleanLabel));
      });
      if (matched) {
        return `/services/${matched.id}`;
      }
    }
    return fallbackHref && fallbackHref !== "#" ? fallbackHref : "/services";
  };

  return (
    <footer className="relative text-slate-300 bg-[#0B132B]" style={{ backgroundColor: 'var(--theme-primary, #0B132B)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Branding & QR */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img
                src={logoUrl}
                alt={branding.name || "BARANGAY UGONG"}
                className="w-12 h-12 rounded-full object-cover bg-white p-0.5 shadow-sm"
              />
              <div>
                <h3 className="font-bold text-white text-sm tracking-wide">
                  {branding.name || "BARANGAY UGONG"}
                </h3>
                <p className="text-xs text-slate-400 tracking-wide uppercase">
                  {branding.tagline || "LUNGSOD NG VALENZUELA"}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {branding.description || "The official information and transparency portal of Barangay Ugong — publishing services, announcements, and community updates for every resident."}
            </p>
            <div className="flex gap-3 mb-6">
              <a
                href={branding.socialLinks?.[0]?.href || "https://www.facebook.com/barangayugongvalenzuelacity"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-blue-600 hover:scale-110 transition-all duration-200 text-slate-300 hover:text-white"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href={branding.socialLinks?.[1]?.href || "https://www.instagram.com/barangayugong"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-pink-600 hover:scale-110 transition-all duration-200 text-slate-300 hover:text-white"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>

            <div className="flex flex-col items-start gap-1.5 mt-2">
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://serbisyoko-3scbuvc-portal.com"
                  alt="QR Code"
                  className="w-[60px] h-[60px]"
                />
              </div>
              <span className="text-[11px] text-slate-500 tracking-wide uppercase">Scan to visit on mobile</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-6">
              {footerQuickLinks.title}
            </h4>
            <ul className="space-y-3">
              {footerQuickLinks.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/#") ? (
                    <button
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="group inline-flex items-center text-sm text-slate-400 hover:text-[#93c5fd] transition-colors duration-200 cursor-pointer"
                    >
                      <span className="transform transition-transform duration-200 group-hover:translate-x-1.5">
                        {link.label}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="group inline-flex items-center text-sm text-slate-400 hover:text-[#93c5fd] transition-colors duration-200"
                    >
                      <span className="transform transition-transform duration-200 group-hover:translate-x-1.5">
                        {link.label}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Document Types */}
          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-6">
              {footerDocumentTypes.title}
            </h4>
            <ul className="space-y-3">
              {footerDocumentTypes.links.map((link) => {
                const targetHref = resolveDocHref(link.label, link.href);
                return (
                  <li key={link.label}>
                    <Link
                      to={targetHref}
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="group inline-flex items-center text-sm text-slate-400 hover:text-[#93c5fd] transition-colors duration-200"
                    >
                      <span className="transform transition-transform duration-200 group-hover:translate-x-1.5">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-6">
              CONTACT INFO
            </h4>
            <ul className="space-y-4">
              {contactList.map((item: any, index: number) => {
                const IconComponent = getContactIcon(item, index);
                const text = item.text || "";

                // Address item
                if (IconComponent === MapPin) {
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                      <div className="text-sm text-slate-400">
                        <p className="leading-relaxed">{text}</p>
                        <Link to="/map" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 inline-flex items-center gap-1">
                          View location on map <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </li>
                  );
                }

                // Phone / Hotline item
                if (IconComponent === Phone) {
                  const lines = text.split("\n");
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                      <div className="text-sm text-slate-400 space-y-0.5">
                        {lines.map((line: string, lineIdx: number) => {
                          const digitsOnly = line.replace(/[^0-9+]/g, "");
                          return (
                            <div key={lineIdx}>
                              {digitsOnly.length >= 7 ? (
                                <a
                                  href={`tel:${digitsOnly}`}
                                  className="hover:text-blue-300 transition-colors"
                                >
                                  {line}
                                </a>
                              ) : (
                                <span>{line}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </li>
                  );
                }

                // Email item
                if (IconComponent === Mail) {
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                      <a
                        href={`mailto:${text}`}
                        className="text-sm text-slate-400 hover:text-blue-300 transition-colors break-all"
                      >
                        {text}
                      </a>
                    </li>
                  );
                }

                // Default / Clock item
                return (
                  <li key={index} className="flex items-start gap-3">
                    <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                    <span className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">
                      {text}
                    </span>
                  </li>
                );
              })}

              {/* Operating Hours */}
              <li className="flex items-start gap-3 pt-1 border-t border-slate-800/60">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                <div className="text-sm text-slate-400">
                  <span className="font-medium text-slate-300 block">Office Hours</span>
                  <span>Monday - Friday, 8:00 AM - 5:00 PM</span>
                  <span className="block text-xs text-slate-500 mt-0.5">VAWC Desk open 24/7</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>


      {/* Copyright Line */}
      <div className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} Barangay Ugong, Valenzuela City. All rights reserved.
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              An official platform of the Barangay Ugong local government unit
            </p>
          </div>
        </div>
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="absolute bottom-24 right-6 w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg hover:-translate-y-1 transition-all duration-200 z-40 focus:outline-none bg-blue-600 cursor-pointer"
        style={{ backgroundColor: 'var(--theme-accent, #2563eb)' }}
        aria-label="Back to top"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </footer>
  );
};

export default Footer;
