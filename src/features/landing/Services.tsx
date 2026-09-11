import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp, FileText, Activity, Shield, Users, Briefcase, Heart, BookOpen, Truck, Monitor, Map } from "lucide-react";
import { ScrollReveal, HoverCard } from "./MotionWrappers";
import { serviceApi } from "@/cms-api/serviceApi";
import { EditableText } from "@/components/EditableText";

const iconMap: Record<string, React.FC<any>> = {
  FileText, Activity, Shield, Users, Briefcase, Heart, BookOpen, Truck, Monitor, Map
};

export const Services = () => {
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceApi.getPublicServices();
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch services", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const documents = services.filter(s => !s.type || s.type === 'DOCUMENT');
  const programs = services.filter(s => s.type === 'SERVICE');

  const displayedDocs = showAllDocs ? documents : documents.slice(0, 6);
  const displayedPrograms = showAllPrograms ? programs : programs.slice(0, 3);

  const renderIcon = (iconName: string, className: string = "") => {
    const IconComponent = iconMap[iconName] || FileText;
    return <IconComponent className={className || "w-6 h-6"} />;
  };

  return (
    <section id="services" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              Barangay Services
            </h2>
            <div>
              <EditableText
                as="p"
                section="sectionHeaders"
                settingKey="servicesSubtitle"
                defaultText="Explore the available document requests and community programs offered by Barangay Ugong."
                className="text-lg text-slate-500 leading-relaxed inline-block"
              />
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading services...</div>
        ) : (
          <div className="space-y-24">

            {/* DOCUMENT REQUESTS SECTION */}
            <div>
              <ScrollReveal delay={0.1}>
                <div className="mb-10 text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Document Requests</h3>
                  <p className="text-base text-slate-500">
                    Click on a document to see its full requirements, fees, and processing time.
                  </p>
                </div>
              </ScrollReveal>

              {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl">No document requests available at the moment.</div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedDocs.map((service, index) => (
                      <ScrollReveal key={service.id} delay={index * 0.05}>
                        <HoverCard className="h-full">
                          <div className="group bg-white border border-slate-200 rounded-2xl p-6 flex flex-col h-full hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/40 text-blue-600 group-hover:text-white">
                              {renderIcon(service.iconName, "w-6 h-6 transition-colors duration-300")}
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-2 uppercase">{service.title}</h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{service.description}</p>
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                              <Link to={`/services/${service.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group/link">
                                View requirements
                                <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                              </Link>
                            </div>
                          </div>
                        </HoverCard>
                      </ScrollReveal>
                    ))}
                  </div>

                  {documents.length > 6 && (
                    <ScrollReveal delay={0.2}>
                      <div className="mt-10 flex justify-center">
                        <button
                          onClick={() => setShowAllDocs(!showAllDocs)}
                          className="inline-flex items-center gap-2 px-8 py-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 font-bold tracking-wide transition-all focus:ring-4 focus:ring-slate-100"
                        >
                          {showAllDocs ? "Show Less" : `View All ${documents.length} Documents`}
                          {showAllDocs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </ScrollReveal>
                  )}
                </>
              )}
            </div>

            {/* COMMUNITY PROGRAMS SECTION */}
            <div>
              <ScrollReveal delay={0.1}>
                <div className="mb-10 text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Community Programs & Services</h3>
                  <p className="text-base text-slate-500">
                    Discover local initiatives, health drives, and other public services provided by the Barangay.
                  </p>
                </div>
              </ScrollReveal>

              {programs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl">No community programs available at the moment.</div>
              ) : (
                <>
                  <div className="flex flex-col gap-6">
                    {displayedPrograms.map((program, index) => (
                      <ScrollReveal key={program.id} delay={index * 0.05}>
                        <Link
                          to={`/services/${program.id}`}
                          className="group block bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 flex gap-5 items-center"
                        >
                          {/* Icon Box as "Picture" */}
                          <div className="w-16 h-16 shrink-0 bg-emerald-50 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-emerald-500 group-hover:shadow-md group-hover:shadow-emerald-500/30 text-emerald-600 group-hover:text-white">
                            {renderIcon(program.iconName, "w-8 h-8 transition-colors duration-300")}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-slate-900 mb-1 truncate uppercase">{program.title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{program.description}</p>
                          </div>

                          {/* Arrow */}
                          <div className="shrink-0 text-slate-300 group-hover:text-emerald-600 transition-colors">
                            <ArrowRight className="w-6 h-6" />
                          </div>
                        </Link>
                      </ScrollReveal>
                    ))}
                  </div>
                  {programs.length > 3 && (
                    <ScrollReveal delay={0.2}>
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={() => setShowAllPrograms(!showAllPrograms)}
                          className="inline-flex items-center gap-2 px-8 py-3 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 font-bold tracking-wide transition-all focus:ring-4 focus:ring-slate-100"
                        >
                          {showAllPrograms ? "Show Less" : `View All ${programs.length} Programs`}
                          {showAllPrograms ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </ScrollReveal>
                  )}
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};

export default Services;
