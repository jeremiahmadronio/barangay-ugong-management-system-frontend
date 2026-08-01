import { useNavigate } from 'react-router-dom'

export function TermsAndConditionPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg border border-slate-200 rounded-2xl">
        {/* Document Header */}
        <div className="text-center mb-10 border-b border-slate-200 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mb-2 text-blue-950">
            Terms and Conditions
          </h1>
          <p className="text-blue-600 font-semibold text-sm">
            Barangay Ugong Digital Management System
          </p>
          <p className="text-xs text-slate-400 mt-1">Effective Date: January 1, 2025</p>
        </div>

        {/* Notice */}
        <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600 text-slate-700 italic text-xs leading-relaxed rounded-r-xl">
          <strong className="text-blue-900 font-bold">Important Notice:</strong> These Terms and
          Conditions govern the access and use of the Barangay Ugong Management System. By accessing
          this system, you acknowledge that you have read, understood, and agree to comply with all
          provisions stated herein.
        </div>

        {/* Content */}
        <div className="space-y-6 text-justify leading-relaxed text-xs sm:text-sm text-slate-700">
          <section>
            <h2 className="text-base font-bold text-blue-950 mb-2">1. Scope and Purpose</h2>
            <p>
              The Barangay Ugong Management System is an official digital platform developed to
              streamline and digitize barangay operations, including resident records management,
              document requests, clearance issuance, case management, and community service coordination.
              Access is strictly restricted to authorized barangay personnel and officials of
              Barangay Ugong, Valenzuela City.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-blue-950 mb-2">
              2. Authorized Users & Role Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-slate-900">Root Administrator:</strong> Manages system-wide
                configurations, user accounts, and security logs.
              </li>
              <li>
                <strong className="text-slate-900">Admin:</strong> Oversees daily operations and
                resident records.
              </li>
              <li>
                <strong className="text-slate-900">Kapitana:</strong> Has supervisory authority over
                all transactions and approvals.
              </li>
              <li>
                <strong className="text-slate-900">Lupong Tagapamayapa:</strong> Manages barangay
                justice and conciliation proceedings.
              </li>
              <li>
                <strong className="text-slate-900">VAWC & BCPC Staff:</strong> Handles confidential
                case records involving women and children.
              </li>
              <li>
                <strong className="text-slate-900">Clearance Staff:</strong> Processes and issues
                barangay clearances and certificates.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-blue-950 mb-2">
              3. Data Privacy and Confidentiality
            </h2>
            <p>
              All users are bound by the{' '}
              <strong className="text-blue-600">
                Data Privacy Act of 2012 (Republic Act No. 10173)
              </strong>
              . You agree to handle all resident data with strict confidentiality, access only the
              data necessary for your official duties, and immediately report any suspected data breach.
            </p>
          </section>
        </div>

        {/* Footer & Action */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <p>Issued by: Office of the Punong Barangay</p>
            <p>Barangay Ugong, Valenzuela City</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors w-full sm:w-auto shadow-md cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
