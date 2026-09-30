import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Hero } from "./Hero";
import { StatsBanner } from "./StatsBanner";
import { About } from "./About";
import { Announcements } from "./Announcements";
import { Services } from "./Services";
import { UpcomingEvents } from "./UpcomingEvents";
import { Contact } from "./Contact";
import { Footer } from "./Footer";
import { EmergencyHotlines } from "./EmergencyHotlines";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

export const LandingPage = () => {
  const { settings } = useWebsiteSettings();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const announcementsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    hero: heroRef,
    about: aboutRef,
    announcements: announcementsRef,
    services: servicesRef,
    events: eventsRef,
    contact: contactRef,
  };

  const scrollToSection = (section: string) => {
    const el = document.getElementById(section) || sectionRefs[section]?.current;
    if (el) {
      const navbarOffset = 90;
      const elementTop = el.getBoundingClientRect().top;
      const scrollPosition = elementTop + window.pageYOffset - navbarOffset;
      window.scrollTo({ top: scrollPosition, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const targetSection = location.hash.replace("#", "") || (location.state as any)?.scrollTo;
    if (!targetSection) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const timers = [50, 200, 500, 800].map((delay) =>
      setTimeout(() => {
        scrollToSection(targetSection);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [location.hash, location.state]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100 && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.title = "Barangay Ugong, Valenzuela City | SerbisyoKo";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "The official information and transparency portal of Barangay Ugong, Valenzuela City.");
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://serbisyoko-3scbuvc-portal.com/");
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://serbisyoko-3scbuvc-portal.com/');
      document.head.appendChild(canonical);
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      <div ref={heroRef} className="w-full">
        <Hero onNavigate={scrollToSection} />
      </div>

      <StatsBanner />

      <div id="about" ref={aboutRef} className="scroll-mt-20">
        <About />
      </div>

      <div id="announcements" ref={announcementsRef} className="scroll-mt-20">
        <Announcements />
      </div>

      <div id="services" ref={servicesRef} className="scroll-mt-20">
        <Services />
      </div>

      <div id="events" ref={eventsRef} className="scroll-mt-20">
        <UpcomingEvents />
      </div>

      <div id="contact" ref={contactRef} className="scroll-mt-20">
        <Contact />
      </div>

      <Footer onNavigate={scrollToSection} />
      <EmergencyHotlines />
    </div>
  );
};

export default LandingPage;
