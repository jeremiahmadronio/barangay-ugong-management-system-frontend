import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  Clock,
  FileText,
  Home,
  Briefcase,
  Shield,
  Heart,
  Users,
  Scale,
  Baby,
  Building2,
} from 'lucide-react'

export const Services = () => {
  const [showAll, setShowAll] = useState(false)

  const services = [
    {
      icon: FileText,
      title: 'Barangay Clearance',
      description:
        'Official clearance document for employment, business registration, and legal purposes.',
      image: '/clearance.png',
      fee: '₱50.00',
      processingTime: '15-30 mins',
      imagePosition: 'object-top',
    },
    {
      icon: Home,
      title: 'Certificate of Residency',
      description:
        'Proof of residence in Barangay Ugong for various transactions and requirements.',
      image: '/residency.png',
      fee: '₱30.00',
      processingTime: '1-2 days',
      imagePosition: 'object-top',
    },
    {
      icon: Briefcase,
      title: 'Business Permit',
      description:
        'Barangay business clearance processing for entrepreneurs and business owners.',
      image: '/busines-permit.jfif',
      fee: 'Varies',
      processingTime: '3-5 days',
      imagePosition: 'object-top',
    },
    {
      icon: Shield,
      title: 'Barangay Protection Order',
      description:
        'Assistance for victims of domestic violence and family abuse cases.',
      image: '/barangay-protection.webp',
      fee: 'FREE',
      processingTime: 'Immediate',
      imagePosition: 'object-top',
    },
    {
      icon: Heart,
      title: 'Health Services',
      description:
        'Medical assistance, consultations, and vaccination programs for residents.',
      image: '/health.png',
      fee: 'FREE',
      processingTime: 'Walk-in',
      imagePosition: 'object-center',
    },
    {
      icon: Users,
      title: 'Senior Citizen & PWD ID',
      description:
        'Registration and services for senior citizens and persons with disabilities.',
      image: '/senior-citizen.jpg',
      fee: 'FREE',
      processingTime: '5-7 days',
      imagePosition: 'object-top',
    },
    {
      icon: Scale,
      title: 'Lupong Tagapamayapa',
      description:
        'Mediation and dispute resolution services for community conflicts.',
      image: '/lupong-tagapagpayapa.jpg',
      fee: 'FREE',
      processingTime: 'By schedule',
      imagePosition: 'object-bottom',
    },
    {
      icon: Baby,
      title: 'Birth Certificate Assistance',
      description:
        'Help with late registration and birth certificate processing.',
      image: '/birt-cert.png',
      fee: '₱100.00',
      processingTime: '2-3 weeks',
      imagePosition: 'object-top',
    },
    {
      icon: Building2,
      title: 'Fencing/Building Permit',
      description:
        'Barangay endorsement for construction and building permit applications.',
      image: '/construction.png',
      fee: '₱200.00',
      processingTime: '3-5 days',
      imagePosition: 'object-top',
    },
  ]

  const displayedServices = showAll ? services : services.slice(0, 6)

  return (
    <section id="services" className="pt-16 pb-20 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-blue-600 font-semibold tracking-wide uppercase text-xs mb-2">
            Public Services
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-3 leading-tight">
            Fast & Accessible Barangay Services
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Reliable municipal and social services for all residents of Barangay Ugong.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {displayedServices.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100">
                    {/* Image Header */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.title}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${service.imagePosition}`}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

                      {/* Icon Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>

                      {/* Fee Badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                            service.fee === 'FREE'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/90 backdrop-blur-sm text-blue-900'
                          }`}
                        >
                          {service.fee}
                        </span>
                      </div>

                      {/* Title on Image */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-lg font-bold text-white drop-shadow-md leading-tight">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{service.processingTime}</span>
                        </div>
                        <Link
                          to="/login"
                          className="inline-flex items-center gap-1 text-blue-600 font-semibold text-xs hover:text-blue-700 transition-colors group/btn"
                        >
                          Request Service
                          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Toggle View Button */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-xs cursor-pointer"
          >
            <span>{showAll ? 'Show Less Services' : 'View All Services'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                showAll ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* CTA Hotline Banner */}
        <div className="mt-16 bg-blue-900 rounded-3xl overflow-hidden shadow-xl text-white">
          <div className="grid lg:grid-cols-2 items-center">
            <div className="p-8 lg:p-12 space-y-4">
              <h3 className="text-2xl lg:text-3xl font-extrabold">Need Quick Assistance?</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Visit our 3S Center or call our hotline during working hours (Monday to Friday, 8:00 AM - 5:00 PM).
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                >
                  <Building2 className="w-4 h-4" /> Visit 3S Center
                </a>
                <a
                  href="tel:0282926754"
                  className="inline-flex items-center gap-2 bg-blue-800 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 border border-blue-700 transition-colors"
                >
                  Call: (02) 8292-XXXX
                </a>
              </div>
            </div>
            <div className="hidden lg:block relative h-full min-h-[280px]">
              <img
                src="/helping.png"
                alt="Community Assistance"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-900/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services
