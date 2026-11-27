import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import { EditableText } from "@/components/EditableText";
import { sharedService } from "@/config/api/shared_api/shared.service";

interface HeroProps {
  onNavigate?: (section: string) => void;
}

export const Hero = ({ onNavigate }: HeroProps) => {
  const { settings } = useWebsiteSettings();
  const hero = settings.heroContent;

  return (
    <section className="relative w-full min-h-screen bg-slate-900">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${sharedService.resolveAssetUrl(hero.backgroundImage, "/assets/Barangay landing.jpg")}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 lg:pt-40 pb-32">
          <div className="max-w-2xl">
            <EditableText
              section="heroContent"
              settingKey="kicker"
              defaultText="WELCOME TO"
              as="p"
              className="text-sm font-semibold tracking-[0.2em] mb-4 uppercase block"
              style={{ color: 'var(--theme-accent)', filter: 'brightness(1.5) saturate(1.2)' }}
            />

            <EditableText
              section="heroContent"
              settingKey="title"
              defaultText="BARANGAY UGONG"
              as="h1"
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-2 block"
            />

            <EditableText
              section="heroContent"
              settingKey="subtitle"
              defaultText="Lungsod ng Valenzuela"
              as="h2"
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 block"
              style={{ color: 'var(--theme-accent)', filter: 'brightness(1.3) saturate(1.1)' }}
            />

            <EditableText
              section="heroContent"
              settingKey="description"
              defaultText="Discover the heart of our community. Stay updated with the latest news, access essential services, and connect with your barangay officials."
              as="p"
              multiline
              className="text-lg text-slate-200 mb-10 leading-relaxed max-w-xl block"
            />

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate?.("services")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-base transition-colors shadow-lg"
              >
                <EditableText section="heroContent" settingKey="primaryButtonText" defaultText="Explore Services" />
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <button
                onClick={() => onNavigate?.("contact")}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-base border border-white/30 hover:border-white/50 transition-colors backdrop-blur-sm"
              >
                <EditableText section="heroContent" settingKey="secondaryButtonText" defaultText="Contact Us" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
