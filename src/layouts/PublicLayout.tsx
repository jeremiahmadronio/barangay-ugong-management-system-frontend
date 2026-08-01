import { Link, Outlet } from 'react-router-dom'
import { Building2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Barangay Serbisyoko
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <a href="#services" className="hover:text-blue-600 transition-colors">
                Services
              </a>
              <a href="#about" className="hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">
                Contact
              </a>
            </nav>

            <Link to="/login">
              <Button size="sm" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Official Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-8 text-center text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Barangay Serbisyoko Portal. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
