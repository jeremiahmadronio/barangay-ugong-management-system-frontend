import { Phone, Mail, User } from 'lucide-react'
import { FacebookIcon } from '@/components/ui/icon/facebook-icon'

export const Officials = () => {
  const barangayCaptain = {
    name: 'Maricel Pineda Emperador',
    position: 'Punong Barangay',
    contact: '09XX-XXX-XXXX',
    email: 'captain@barangayugong.gov.ph',
    facebook: 'https://facebook.com/barangayugong',
    description:
      'Your partner in building a more progressive and peaceful Barangay. Here, your welfare always comes first.',
  }

  const kagawads = [
    { name: 'Kag. Maria Santos', position: 'Peace & Order', contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Jose Garcia', position: 'Health', contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Ana Reyes', position: 'Education', contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Pedro Ramos', position: 'Infrastructure', contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Rosa Mendoza', position: 'Environment', contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Luis Aquino', position: 'Social Services', contact: '09XX-XXX-XXXX' },
    { name: 'Kag. Elena Cruz', position: 'Budget & Finance', contact: '09XX-XXX-XXXX' },
  ]

  const secretary = { name: 'Maria Clara Bautista', position: 'Barangay Secretary', contact: '09XX-XXX-XXXX' }
  const treasurer = { name: 'Antonio Villanueva', position: 'Barangay Treasurer', contact: '09XX-XXX-XXXX' }

  const Avatar = ({ size = 'md' }: { size?: 'lg' | 'md' | 'sm' }) => {
    const sizeClasses = {
      lg: 'w-28 h-28',
      md: 'w-20 h-20',
      sm: 'w-16 h-16',
    }
    const iconSizes = {
      lg: 'w-14 h-14',
      md: 'w-10 h-10',
      sm: 'w-8 h-8',
    }
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-blue-100 border-2 border-blue-200 shadow-xs flex items-center justify-center`}
      >
        <User className={`${iconSizes[size]} text-blue-500`} />
      </div>
    )
  }

  return (
    <section id="officials" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-blue-600 font-semibold tracking-wide uppercase text-xs mb-2">
            Leadership & Service
          </p>
          <h2 className="text-4xl font-bold text-blue-900 mb-3 tracking-tight">
            Barangay Officials
          </h2>
          <p className="text-slate-600 text-base">
            Your partners in every step. The Barangay Council is always ready to serve you.
          </p>
        </div>

        {/* Barangay Captain */}
        <div className="flex flex-col items-center mb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col items-center w-full max-w-md text-center">
            <div className="mb-4">
              <Avatar size="lg" />
            </div>
            <span className="inline-block bg-blue-900 text-white text-xs font-bold px-4 py-1 rounded-full mb-2 tracking-wide uppercase">
              {barangayCaptain.position}
            </span>
            <h3 className="text-2xl font-extrabold text-blue-900 mb-2">{barangayCaptain.name}</h3>
            <p className="text-slate-600 text-sm italic font-medium leading-relaxed mb-6">
              "{barangayCaptain.description}"
            </p>

            <div className="flex flex-wrap gap-2.5 justify-center">
              <a
                href={`tel:${barangayCaptain.contact}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{barangayCaptain.contact}</span>
              </a>
              <a
                href={barangayCaptain.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <FacebookIcon className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
              <a
                href={`mailto:${barangayCaptain.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-900 text-blue-900 text-xs font-semibold hover:bg-blue-50 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Secretary & Treasurer */}
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 max-w-2xl mx-auto">
          {[secretary, treasurer].map((official, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 flex-1 shadow-md border border-blue-100 flex flex-col items-center text-center"
            >
              <div className="mb-3">
                <Avatar size="md" />
              </div>
              <span className="inline-block bg-blue-900 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-2 tracking-wide uppercase">
                {official.position}
              </span>
              <h4 className="font-bold text-blue-900 text-base mb-1">{official.name}</h4>
              <span className="mt-1 flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {official.contact}
              </span>
            </div>
          ))}
        </div>

        {/* Kagawads */}
        <div>
          <h3 className="text-xl font-bold text-blue-900 mb-8 text-center tracking-wide uppercase text-sm">
            Sangguniang Barangay
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {kagawads.map((k, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <Avatar size="sm" />
                </div>
                <span className="inline-block bg-blue-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 tracking-wide uppercase">
                  {k.position}
                </span>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{k.name}</h4>
                <span className="mt-1 flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {k.contact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Officials
