import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { FacebookIcon } from '@/components/ui/icon/facebook-icon'

export const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Our Location',
      content: '3S Center, Barangay Ugong',
      subtext: 'Valenzuela City, Metro Manila',
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '(02) 8292-XXXX',
      subtext: 'Hotline: 09XX-XXX-XXXX',
    },
    {
      icon: Mail,
      title: 'Email Us',
      content: 'barangay.ugong@valenzuela.gov.ph',
      subtext: 'Response within 24 hours',
    },
    {
      icon: Clock,
      title: 'Office Hours',
      content: 'Monday - Friday',
      subtext: '8:00 AM - 5:00 PM',
    },
  ]

  return (
    <section id="contact" className="py-24 bg-slate-50 relative overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-blue-600 font-semibold tracking-wide uppercase text-xs mb-2">
            Reach Out
          </p>
          <h2 className="text-4xl font-bold text-blue-950 mb-4 tracking-tight">Get in Touch</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            We're here to help. Visit our office or call our hotline for prompt service.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-md border border-slate-100 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-900 group-hover:text-white transition-all duration-300 shadow-xs">
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="text-lg font-bold text-blue-950 mb-2">{info.title}</h3>
                <p className="text-slate-700 font-semibold text-sm mb-1">{info.content}</p>
                <p className="text-slate-500 text-xs">{info.subtext}</p>
              </div>
            )
          })}
        </div>

        {/* Social Media Connect Bar */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl text-center sm:text-left text-white">
            <div>
              <h3 className="text-2xl font-bold mb-2">Connect with us online</h3>
              <p className="text-blue-200 text-sm">
                Stay updated on announcements and programs through our Facebook page.
              </p>
            </div>

            <a
              href="https://www.facebook.com/barangayugongvalenzuelacity"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-950 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-md text-sm shrink-0"
            >
              <FacebookIcon className="w-5 h-5 text-blue-600" />
              Facebook Page
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
