import { ChevronRight } from 'lucide-react'

interface HeroProps {
  onNavigate?: (section: string) => void
}

export const Hero = ({ onNavigate }: HeroProps) => {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      <div
        className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/Barangay landing.jpg')` }}
      >
        {/* Gradient fade on left edge */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent lg:via-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 lg:pt-40 w-full">
          <div className="max-w-xl bg-white/90 lg:bg-transparent p-6 lg:p-0 rounded-2xl backdrop-blur-xs lg:backdrop-none">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-900 leading-tight mb-6">
              Barangay Ugong
              <span className="block text-blue-600">City of Valenzuela</span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Serving the community with dedication and integrity. Together, let's build a
              better, safer, and more progressive barangay.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onNavigate?.('services')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-blue-200 cursor-pointer"
              >
                Our Services
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('contact')}
                className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-xl font-bold text-base border-2 border-blue-600 transition-colors cursor-pointer"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
