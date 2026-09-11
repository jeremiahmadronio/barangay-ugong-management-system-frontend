const FacebookIcon = ({ className = "w-5 h-5", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

import { contactCards, socialBanner } from "./landingPageData";
import { ScrollReveal, HoverCard } from "./MotionWrappers";
import { EditableText } from "@/components/EditableText";

export const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
              Get in Touch
            </h2>
            <div>
              <EditableText
                as="p"
                section="sectionHeaders"
                settingKey="contactSubtitle"
                defaultText="Reach the barangay through any of these channels — or simply walk into the hall during office hours."
                className="text-lg text-slate-500 leading-relaxed inline-block"
              />
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactCards.map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 0.1}>
              <HoverCard className="h-full">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center flex flex-col items-center h-full">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
                    <card.icon className="w-7 h-7" style={{ color: 'var(--theme-accent)' }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-700 font-medium">{card.primaryText}</p>
                  <p className="text-sm text-slate-400">{card.secondaryText}</p>
                </div>
              </HoverCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl px-8 py-8 md:px-12 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left" style={{ backgroundColor: 'var(--theme-accent)' }}>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{socialBanner.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{socialBanner.description}</p>
              </div>
              <a
                href={socialBanner.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-lg flex-shrink-0"
                style={{ color: 'var(--theme-accent)' }}
              >
                <FacebookIcon className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                {socialBanner.buttonText}
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Contact;