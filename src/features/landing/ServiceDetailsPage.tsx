import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Footer } from "./Footer";
import { servicesService } from "@/config/api/cms/cms.service";

export const ServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [service, setService] = useState<any>(null);
  const [otherServices, setOtherServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  const safeParseList = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch {
      return String(raw).split('\n').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await servicesService.getPublicServices();
        const dataArray = Array.isArray(data) ? data : [];
        const found = dataArray.find((s: any) => s.id.toString() === id);
        if (found) {
          found.requirementsList = safeParseList(found.requirements);
          found.stepsList = safeParseList(found.steps);
          setService(found);
          const currentType = found.type || 'DOCUMENT';
          setOtherServices(dataArray.filter((s: any) => {
            const t = s.type || 'DOCUMENT';
            return s.id.toString() !== id && t === currentType;
          }));
        } else {
          navigate('/services', { replace: true });
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [id, navigate]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
          Loading service information...
        </div>
      );
    }
    if (!service) return <Navigate to="/services" replace />;

    const isDocument = !service.type || service.type === 'DOCUMENT';

    return (
      <>
        {/* Header Banner */}
        <div className="bg-slate-900 text-white py-14 lg:py-16 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link to="/services" className="hover:text-white transition-colors">Services</Link>
              <span>/</span>
              <span className="text-slate-300 font-semibold">{service.title}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              {service.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {service.description}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14 items-start">
            
            {/* Left Content Column */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Service Specifications Card (Clean, No AI Icons) */}
              <div className="bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid grid-cols-1 sm:grid-cols-3 shadow-2xs">
                {isDocument ? (
                  <>
                    <div className="p-5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Standard Fee
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {service.fee || 'Free'}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Processing Time
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {service.processingTime || 'Standard'}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Release Location
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {service.location || 'Barangay Hall'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Operating Days
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {service.operatingDays || 'Monday to Friday'}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Operating Hours
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {service.operatingHours || '8:00 AM - 5:00 PM'}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Classification
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        Community Service
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Requirements Section */}
              {service.requirementsList.length > 0 && (
                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight">
                    Requirements Checklist
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Please prepare the following documents before proceeding with your application:
                  </p>
                  
                  <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                    {service.requirementsList.map((req: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 text-sm text-slate-800">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed font-medium">{req}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Step-by-Step Procedure */}
              {service.stepsList.length > 0 && (
                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight">
                    Step-by-Step Procedure
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Follow the standard process at the Barangay Hall:
                  </p>
                  
                  <div className="space-y-2.5">
                    {service.stepsList.map((step: string, index: number) => (
                      <div key={index} className="flex items-start gap-3.5 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex-shrink-0">
                          Step {index + 1}
                        </span>
                        <p className="text-sm text-slate-800 font-medium leading-relaxed pt-0.5">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Clean Claiming Process (No AI Package Icon, No Blue Vertical Bar) */}
              {isDocument && service.claimProcess && (
                <section>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Claiming Process
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {service.claimProcess}
                    </p>
                  </div>
                </section>
              )}

              {/* Back to Catalog Link */}
              <div className="pt-4 border-t border-slate-200">
                <Link 
                  to="/services" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Services Directory
                </Link>
              </div>

            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs sticky top-24">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                  {service.type === 'SERVICE' ? 'Other Community Services' : 'Other Document Requests'}
                </h3>
                {otherServices.length > 0 ? (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {otherServices.map((other) => (
                      <li key={other.id}>
                        <Link 
                          to={`/services/${other.id}`}
                          className="block py-2.5 text-slate-700 hover:text-blue-600 font-medium transition-colors"
                        >
                          {other.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No other services listed.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailsPage;
