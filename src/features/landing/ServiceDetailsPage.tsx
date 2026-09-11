import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Clock, MapPin, Tag, Package, Calendar } from "lucide-react";
import { Footer } from "./Footer";
import { serviceApi } from "@/cms-api/serviceApi";

export const ServiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [service, setService] = useState<any>(null);
  const [otherServices, setOtherServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceApi.getPublicServices();
        const dataArray = Array.isArray(data) ? data : [];
        const found = dataArray.find((s: any) => s.id.toString() === id);
        if (found) {
          // Parse JSON strings to arrays
          found.requirementsList = found.requirements ? JSON.parse(found.requirements) : [];
          found.stepsList = found.steps ? JSON.parse(found.steps) : [];
          setService(found);
          const currentType = found.type || 'DOCUMENT';
          setOtherServices(dataArray.filter((s: any) => {
            const t = s.type || 'DOCUMENT';
            return s.id.toString() !== id && t === currentType;
          }));
        } else {
          // Service not found
          navigate('/#services', { replace: true });
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [id, navigate]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center py-20 text-slate-500">Loading service details...</div>;
    if (!service) return <Navigate to="/#services" replace />;

    return (
      <>
        {/* Header Banner */}
        <div 
          className="text-white py-16 lg:py-20"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-slate-400 font-medium mb-6 flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>›</span>
              <Link to="/#services" className="hover:text-white transition-colors">Services</Link>
              <span>›</span>
              <span className="text-white uppercase">{service.title}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-5 tracking-tight uppercase">{service.title}</h1>
            <p className="text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed">{service.description}</p>
          </div>
        </div>

        <motion.div 
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        >
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Left Content Column */}
            <div className="lg:col-span-2 space-y-14">
              
              {/* Quick Info Cards */}
              <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {service.type === 'SERVICE' && service.operatingDays && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 text-slate-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wider uppercase">Operating Days</span>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">{service.operatingDays}</p>
                  </div>
                )}
                
                {service.type === 'SERVICE' && service.operatingHours && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 text-slate-500 mb-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wider uppercase">Operating Hours</span>
                    </div>
                    <p className="font-bold text-slate-900 text-lg">{service.operatingHours}</p>
                  </div>
                )}

                {(!service.type || service.type === 'DOCUMENT') && (
                  <>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <Tag className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider uppercase">Fee</span>
                      </div>
                      <p className="font-bold text-slate-900 text-lg">{service.fee || 'TBD'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider uppercase">Processing Time</span>
                      </div>
                      <p className="font-bold text-slate-900 text-lg">{service.processingTime || 'TBD'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-wider uppercase">Where to Go</span>
                      </div>
                      <p className="font-bold text-slate-900 text-lg">{service.location || 'Barangay Hall'}</p>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Requirements */}
              {service.requirementsList.length > 0 && (
                <motion.section variants={itemVariants}>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Requirements checklist</h2>
                  <p className="text-slate-500 mb-8">Bring the original documents together with one photocopy of each.</p>
                  <ul className="space-y-5">
                    {service.requirementsList.map((req: string, index: number) => (
                      <li key={index} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                        <span className="text-slate-700 leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              )}

              {/* Step-by-step process */}
              {service.stepsList.length > 0 && (
                <motion.section variants={itemVariants}>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-8 tracking-tight">Step-by-step process</h2>
                  <div className="space-y-8">
                    {service.stepsList.map((step: string, index: number) => (
                      <div key={index} className="flex gap-5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-slate-700 pt-1 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* How to claim */}
              {(!service.type || service.type === 'DOCUMENT') && (
                <motion.section variants={itemVariants}>
                  <div className="bg-white border border-slate-200 rounded-xl p-8 lg:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                    <div className="flex items-center gap-3 mb-5">
                      <Package className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">How to claim</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                      {service.claimProcess || 'Claim the document at the releasing section upon presentation of receipt.'}
                    </p>
                  </div>
                </motion.section>
              )}

              <motion.div variants={itemVariants} className="pt-10 border-t border-slate-200">
                <Link to="/#services" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to all services
                </Link>
              </motion.div>

            </div>

            {/* Right Sidebar */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm sticky top-28">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                  {service.type === 'SERVICE' ? 'Other Programs' : 'Other Documents'}
                </h3>
                <ul className="space-y-5">
                  {otherServices.map((other) => (
                    <li key={other.id}>
                      <Link 
                        to={`/services/${other.id}`}
                        className="block text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors uppercase"
                      >
                        {other.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-grow pt-20"
      >
        {renderContent()}
      </motion.main>
      <Footer />
    </div>
  );
};

export default ServiceDetailsPage;
