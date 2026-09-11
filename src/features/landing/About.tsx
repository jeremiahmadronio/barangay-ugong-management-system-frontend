import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Calendar, Heart, Building } from "lucide-react";
import { ScrollReveal, HoverCard } from "./MotionWrappers";
import { EditableText } from "@/components/EditableText";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

const tabs = [
  { id: "vision-mission", label: "Vision & Mission", icon: Shield },
  { id: "history", label: "Our History", icon: Building },
  { id: "purpose", label: "Our Purpose", icon: Heart },
];

// Data is now fetched from context

export const About = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const { settings } = useWebsiteSettings();
  const { visionMission, history, purpose } = settings.aboutSectionData;

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              About Barangay Ugong
            </h2>
            <div>
              <EditableText 
                as="p"
                section="sectionHeaders"
                settingKey="aboutSubtitle"
                defaultText="More than six decades of local service to the families, workers, and businesses of Ugong."
                className="text-base text-slate-500 leading-relaxed inline-block"
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={activeTab === tab.id ? { backgroundColor: 'var(--theme-accent)' } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {activeTab === "vision-mission" && (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: "Our Vision", text: visionMission.vision },
              { icon: Heart, title: "Our Mission", text: visionMission.mission },
            ].map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 0.15} className="h-full">
                <HoverCard className="h-full">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 h-full hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                      <card.icon className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{card.text}</p>
                  </div>
                </HoverCard>
              </ScrollReveal>
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <ScrollReveal>
            <div className="max-w-5xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-8 lg:p-10 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                <div className="rounded-2xl overflow-hidden shadow-md">
                  <img
                    src="/Screenshot 2026-02-14 041042.png"
                    alt="Barangay Ugong community"
                    className="w-full h-64 lg:h-80 object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{history.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {history.description}
                  </p>
                  <div className="space-y-4">
                    {history.timeline.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <span className="text-sm font-bold w-12 flex-shrink-0" style={{ color: 'var(--theme-accent)' }}>{item.year}</span>
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--theme-accent)' }} />
                        <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {activeTab === "purpose" && (
          <ScrollReveal>
            <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-8 lg:p-10 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{purpose.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {purpose.description1}
                  </p>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--theme-accent)' }}>
                    {purpose.description2}
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mt-8">
                {purpose.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium text-slate-700 cursor-default"
                  >
                    {feature}
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};

export default About;
