import { Link } from "react-router-dom";
import { Shield, Lock, Clock, MapPin, Phone, Mail, ChevronUp } from "lucide-react";
import {
  footerBranding,
  footerQuickLinks,
  footerDocumentTypes,
  footerContactInfo,
} from "./landingPageData";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

interface FooterProps {
  onNavigate?: (section: string) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const { settings } = useWebsiteSettings();

  const handleLinkClick = (href: string) => {
    if (href.startsWith("/#")) {
      onNavigate?.(href.replace("/#", ""));
    }
  };

  const branding = settings.footerBranding || footerBranding;
  const logoUrl = settings.logoUrl || branding.logoSrc || "/ugong-logo.png";

  const contactList = (settings.footerContactInfo && settings.footerContactInfo.length > 0)
    ? settings.footerContactInfo
    : [
        { iconName: 'Clock', text: 'Barangay Ugong Hall, M.H. del Pilar St., Barangay Ugong, Valenzuela City 1440' },
        { iconName: 'Clock', text: '(02) 8291-4567\nHotline 0917 555 8823' },
        { iconName: 'Clock', text: 'barangayugong@valenzuela.gov.ph' }
      ];

  const getContactIcon = (item: any) => {
    if (item.iconName === 'MapPin') return MapPin;
    if (item.iconName === 'Phone') return Phone;
    if (item.iconName === 'Mail') return Mail;
    return Clock;
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
                className="w-12 h-12 rounded-full object-cover bg-white p-0.5"
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
                href={footerBranding.socialLinks[0]?.href || "https://www.facebook.com/barangayugongvalenzuelacity"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 hover:bg-blue-600 hover:scale-110 transition-all duration-200 text-slate-300 hover:text-white"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/barangayugong"
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
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://barangayugong.gov.ph" 
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
                      onClick={() => handleLinkClick(link.href)}
                      className="group inline-flex items-center text-sm text-slate-400 hover:text-[#93c5fd] transition-colors duration-200"
                    >
                      <span className="transform transition-transform duration-200 group-hover:translate-x-1.5">
                        {link.label}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={link.href}
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
              {footerDocumentTypes.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center text-sm text-slate-400 hover:text-[#93c5fd] transition-colors duration-200"
                  >
                    <span className="transform transition-transform duration-200 group-hover:translate-x-1.5">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="font-bold text-white text-sm tracking-wide mb-6">
              CONTACT INFO
            </h4>
            <ul className="space-y-4">
              {contactList.map((item: any, index: number) => {
                const IconComponent = getContactIcon(item);
                return (
                  <li key={index} className="flex items-start gap-3">
                    <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                    <span className="text-sm text-slate-400 whitespace-pre-line">
                      {item.text}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-start gap-3 mt-4">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
                <span className="text-sm text-slate-400 whitespace-pre-line">
                  Monday - Friday, 8:00 AM - 5:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-colors">
              <Shield className="w-4 h-4 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
              <span className="text-[12px] sm:text-[13px] font-medium tracking-wide">Data Privacy Act Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-colors">
              <Lock className="w-4 h-4 text-blue-400" style={{ color: 'var(--theme-accent, #3b82f6)' }} />
              <span className="text-[12px] sm:text-[13px] font-medium tracking-wide">Secure Platform</span>
            </div>
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
