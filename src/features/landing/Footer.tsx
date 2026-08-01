import { Phone, Mail, MapPin, Heart, Building2 } from 'lucide-react'
import { FacebookIcon } from '@/components/ui/icon/facebook-icon'

interface FooterProps {
  onNavigate?: (section: string) => void
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { label: 'Home', href: 'hero' },
    { label: 'About Us', href: 'about' },
    { label: 'Services', href: 'services' },
    { label: 'Officials', href: 'officials' },
    { label: 'Social Media', href: 'social' },
    { label: 'Contact', href: 'contact' },
  ]

  const services = [
    { label: 'Barangay Clearance', href: '#services' },
    { label: 'Business Permit', href: '#services' },
    { label: 'Certificate of Residency', href: '#services' },
    { label: 'Barangay Protection Order', href: '#services' },
    { label: 'Health Services', href: '#services' },
  ]

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Barangay Ugong</h3>
                <p className="text-xs text-slate-400">Valenzuela City</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Serving the community of Barangay Ugong since 1963. Together, let's advance
              progress and peace in our barangay.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/barangayugongvalenzuelacity"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <FacebookIcon className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(link.href)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Our Services</h4>
            <ul className="space-y-2.5 text-xs">
              {services.map((service, index) => (
                <li key={index}>
                  <a href={service.href} className="text-slate-400 hover:text-white transition-colors">
                    {service.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Contact Info</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-slate-400">3S Center, Barangay Ugong, Valenzuela City</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-slate-400">(02) 8292-XXXX</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-slate-400">barangay.ugong@valenzuela.gov.ph</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {currentYear} Barangay Ugong, Valenzuela City. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-red-500" /> for our community
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
