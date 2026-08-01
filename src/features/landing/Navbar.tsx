import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone, Mail, Clock } from 'lucide-react'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/#about' },
    { label: 'Services', href: '/#services' },
    { label: 'Officials', href: '/#officials' },
    { label: 'Contact', href: '/#contact' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Bar - Contact Info */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs sm:text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                <span>(02) 8292-XXXX</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>barangay.ugong@valenzuela.gov.ph</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-blue-200 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Monday - Friday, 8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className={`transition-all duration-300 ${
          isScrolled ? 'bg-blue-800/95 backdrop-blur-md shadow-lg' : 'bg-blue-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-12 h-12 rounded-full bg-white p-1 shadow-md border-2 border-blue-200 overflow-hidden flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Barangay Ugong Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to ugong-logo.png if logo.png is unavailable
                    ;(e.target as HTMLImageElement).src = '/ugong-logo.png'
                  }}
                />
              </div>
              <div>
                <h1 className="font-bold text-white text-base sm:text-lg leading-tight">
                  BARANGAY UGONG
                </h1>
                <p className="text-blue-200 text-xs">Lungsod ng Valenzuela</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-white relative group"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white group-hover:w-3/4 transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Link
                to="/login"
                className="bg-white hover:bg-blue-50 text-blue-800 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-xs"
              >
                Official Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-blue-700 cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden bg-blue-800 border-t border-blue-700">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-2.5 text-left text-white hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full mt-3 bg-white hover:bg-blue-50 text-blue-800 px-4 py-2.5 rounded-lg font-bold transition-colors text-center text-sm"
              >
                Official Login
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
