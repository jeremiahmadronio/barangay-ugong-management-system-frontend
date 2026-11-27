import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsService } from '@/config/api/cms/cms.service'
import { 
  heroContent as defaultHero,
  contactCards as defaultContact,
  socialBanner as defaultSocial,
  footerBranding as defaultFooterBranding,
  footerContactInfo as defaultFooterContact,
  faqData as defaultFaq,
  emergencyHotlines as defaultHotlines,
  aboutTabs as defaultAboutTabs,
  aboutTabContents as defaultAboutContents,
  statsItems as defaultStatsItems,
  upcomingEvents as defaultEvents
} from '../features/landing/landingPageData';

// We define our settings state based on the keys we will use
export interface WebsiteSettings {
  // Global Branding
  logoUrl: string;
  loginBackgroundUrl?: string;

  // Section Headers
  sectionHeaders: {
    aboutTitle: string;
    aboutSubtitle: string;
    servicesTitle: string;
    servicesSubtitle: string;
    eventsTitle: string;
    eventsSubtitle: string;
    contactTitle: string;
    contactSubtitle: string;
    announcementsSubtitle: string;
    officialsSubtitle: string;
    calendarSubtitle: string;
    faqSubtitle: string;
    faqFooterSubtitle: string;
  };

  // Hero
  heroContent: typeof defaultHero;
  
  // Others
  contactCards: typeof defaultContact;
  socialBanner: typeof defaultSocial;
  footerBranding: typeof defaultFooterBranding;
  footerContactInfo: typeof defaultFooterContact;
  faqData: typeof defaultFaq;
  emergencyHotlines: typeof defaultHotlines;
  aboutTabs: typeof defaultAboutTabs;
  aboutTabContents: typeof defaultAboutContents;
  statsData: { value: string; label: string }[];
  aboutSectionData: {
    visionMission: { vision: string; mission: string; };
    history: { title: string; description: string; imageUrl: string; timeline: { year: string; text: string }[]; };
    purpose: { title: string; description1: string; description2: string; features: string[]; };
  };
  eventsData: typeof defaultEvents;
  colorTheme: {
    name: string;
    primary: string;
    accent: string;
  };
}

const defaultSettings: WebsiteSettings = {
  logoUrl: defaultFooterBranding.logoSrc,
  
  sectionHeaders: {
    aboutTitle: "About Barangay Ugong",
    aboutSubtitle: "More than six decades of local service to the families, workers, and businesses of Ugong.",
    servicesTitle: "Barangay Services",
    servicesSubtitle: "Explore the available document requests and community programs offered by Barangay Ugong.",
    eventsTitle: "Upcoming Events",
    eventsSubtitle: "Assemblies, missions, and community activities open to all residents of Barangay Ugong.",
    contactTitle: "Get in Touch",
    contactSubtitle: "Reach the barangay through any of these channels — or simply walk into the hall during office hours.",
    announcementsSubtitle: "Official notices, advisories, and program updates published by Barangay Ugong.",
    officialsSubtitle: "The elected and appointed officers of Barangay Ugong for the 2025–2028 term, arranged by the council structure they serve in.",
    calendarSubtitle: "Check the schedule of upcoming barangay activities, health missions, and public assemblies.",
    faqSubtitle: "Find answers to common questions about barangay services, requirements, and community programs.",
    faqFooterSubtitle: "Can't find the answer you're looking for? Reach out to our team, and we'll be happy to help."
  },

  heroContent: defaultHero,
  contactCards: defaultContact,
  socialBanner: defaultSocial,
  footerBranding: defaultFooterBranding,
  footerContactInfo: defaultFooterContact,
  faqData: defaultFaq,
  emergencyHotlines: defaultHotlines,
  aboutTabs: defaultAboutTabs,
  aboutTabContents: defaultAboutContents,
  statsData: defaultStatsItems.map(item => ({ value: item.value, label: item.label })),
  aboutSectionData: {
    visionMission: {
      vision: "A progressive, disaster-resilient, and united Barangay Ugong where every household enjoys safe streets, accessible health care, and a local government they can see, question, and trust.",
      mission: "To deliver prompt and courteous frontline services, to spend every peso of barangay funds transparently, and to bring programs closer to residents through empowered purok leaders and open community assemblies."
    },
    history: {
      title: "Serving Ugong since 1963",
      description: "What began as a farming and riverside barrio on the western edge of Valenzuela has grown into one of the city's most densely populated communities. Through every change — the arrival of industry, the widening of MacArthur Highway, and the floods that tested us — the barangay has kept the same duty: to be the first office a resident can walk into and be heard.",
      imageUrl: "/assets/Screenshot 2026-02-14 041042.png",
      timeline: [
        { year: "1963", text: "Barangay Ugong is formally established as a barrio of Valenzuela." },
        { year: "1978", text: "The first permanent Barangay Hall is built along M.H. del Pilar Street." },
        { year: "1996", text: "Puroks are reorganized into the 15 zones still in use today." },
        { year: "2014", text: "The Barangay Health Station and VAWC desk begin round-the-clock operations." },
        { year: "2026", text: "Barangay records and services are published through this public portal." }
      ]
    },
    purpose: {
      title: "Why this portal exists",
      description1: "Too often, residents find out what's needed only after lining up at the barangay hall or hear about a program through word of mouth, days after it already started. This portal exists to close that gap. Requirements, announcements, and contact details for every official are posted here, kept updated by barangay staff, and available anytime not just during office hours.",
      description2: "Information about your barangay shouldn't be hard to find. That's the point of this page.",
      features: [
        "Requirements published in full",
        "Programs announced in advance",
        "Officials and offices named"
      ]
    }
  },
  eventsData: defaultEvents,
  colorTheme: {
    name: 'Midnight Navy',
    primary: '#0B132B',
    accent: '#2563eb',
  },
};

interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  originalSettings: WebsiteSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  hasUnsavedChanges: boolean;
  updateSettingLocal: (section: keyof WebsiteSettings, key: string, value: any) => void;
  saveAllSettings: () => Promise<void>;
  discardChanges: () => void;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType>({
  settings: defaultSettings,
  originalSettings: null,
  loading: true,
  refreshSettings: async () => {},
  editMode: false,
  setEditMode: () => {},
  hasUnsavedChanges: false,
  updateSettingLocal: () => {},
  saveAllSettings: async () => {},
  discardChanges: () => {}
});

const SETTINGS_CACHE_KEY = "cached_website_settings";

function getCachedSettings(): WebsiteSettings {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) {
      return { ...defaultSettings, ...JSON.parse(cached) };
    }
  } catch {
    // ignore
  }
  return defaultSettings;
}

// Helper: derive a slightly darker shade for hover states
function darken(hex: string, amount = 20): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function applyThemeToCss(theme: { primary: string; accent: string }) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-dark', darken(theme.primary));
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-accent-dark', darken(theme.accent));
}

export const WebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(getCachedSettings);
  const [originalSettings, setOriginalSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check URL and Session for edit mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isEditMode =
      params.get('editMode') === 'true' ||
      params.get('liveEditor') === 'true' ||
      sessionStorage.getItem('is_live_editing') === 'true';

    if (isEditMode) {
      const tempToken = localStorage.getItem("temp_edit_token");
      if (tempToken) {
        sessionStorage.setItem("token", tempToken);
        localStorage.removeItem("temp_edit_token");
      }
      
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      if (token) {
        sessionStorage.setItem("token", token);
      }
      setEditMode(true);
      sessionStorage.setItem('is_live_editing', 'true');
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAllSettings();
      
      const newSettings = { ...defaultSettings };

      // Parse Branding
      if (data["brand.logo"] !== undefined) {
        newSettings.logoUrl = data["brand.logo"];
      } else if (data["content.logoUrl"] !== undefined) {
        newSettings.logoUrl = data["content.logoUrl"];
      }

      if (data["brand.loginBackground"] !== undefined) {
        newSettings.loginBackgroundUrl = data["brand.loginBackground"];
      } else if (data["content.loginBackgroundUrl"] !== undefined) {
        newSettings.loginBackgroundUrl = data["content.loginBackgroundUrl"];
      }

      // Parse JSON Objects
      if (data['content.sectionHeaders']) newSettings.sectionHeaders = JSON.parse(data['content.sectionHeaders']);
      if (data['content.hero']) newSettings.heroContent = JSON.parse(data['content.hero']);
      else if (data['content.heroContent']) newSettings.heroContent = JSON.parse(data['content.heroContent']);
      if (data['content.contactCards']) newSettings.contactCards = JSON.parse(data['content.contactCards']);
      if (data['content.socialBanner']) newSettings.socialBanner = JSON.parse(data['content.socialBanner']);
      if (data['content.footerBranding']) newSettings.footerBranding = JSON.parse(data['content.footerBranding']);
      if (data['content.footerContactInfo']) newSettings.footerContactInfo = JSON.parse(data['content.footerContactInfo']);
      if (data['content.faqData']) newSettings.faqData = JSON.parse(data['content.faqData']);
      if (data['content.emergencyHotlines']) newSettings.emergencyHotlines = JSON.parse(data['content.emergencyHotlines']);
      if (data['content.aboutTabs']) newSettings.aboutTabs = JSON.parse(data['content.aboutTabs']);
      if (data['content.aboutTabContents']) newSettings.aboutTabContents = JSON.parse(data['content.aboutTabContents']);
      if (data['content.statsData']) newSettings.statsData = JSON.parse(data['content.statsData']);
      if (data['content.aboutSectionData']) newSettings.aboutSectionData = JSON.parse(data['content.aboutSectionData']);
      if (data['content.eventsData']) newSettings.eventsData = JSON.parse(data['content.eventsData']);
      if (data['content.colorTheme']) newSettings.colorTheme = JSON.parse(data['content.colorTheme']);

      // Apply theme CSS variables immediately
      applyThemeToCss(newSettings.colorTheme);

      setSettings(newSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(newSettings))); // Keep a deep copy of the original
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newSettings));
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error("Failed to parse settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Re-apply CSS variables whenever colorTheme changes (e.g. admin picks new theme)
  useEffect(() => {
    applyThemeToCss(settings.colorTheme);
  }, [settings.colorTheme]);

  const updateSettingLocal = useCallback((section: keyof WebsiteSettings, key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      // If it's a nested object (like heroContent)
      if (typeof newSettings[section] === 'object' && newSettings[section] !== null && !Array.isArray(newSettings[section])) {
        (newSettings[section] as any) = {
          ...newSettings[section] as any,
          [key]: value
        };
      } else {
        // Direct property
        (newSettings[section] as any) = value;
      }
      
      return newSettings;
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveAllSettings = async () => {
    if (!hasUnsavedChanges || !originalSettings) return;
    
    setLoading(true);
    try {
      const updates: Record<string, string> = {};
      
      // Compare and build updates payload (ONLY sending what changed)
      if (JSON.stringify(settings.sectionHeaders) !== JSON.stringify(originalSettings.sectionHeaders)) {
        updates["content.sectionHeaders"] = JSON.stringify(settings.sectionHeaders);
      }
      if (JSON.stringify(settings.heroContent) !== JSON.stringify(originalSettings.heroContent)) {
        updates["content.hero"] = JSON.stringify(settings.heroContent);
        updates["content.heroContent"] = JSON.stringify(settings.heroContent);
      }
      if (JSON.stringify(settings.contactCards) !== JSON.stringify(originalSettings.contactCards)) {
        updates["content.contactCards"] = JSON.stringify(settings.contactCards);
      }
      if (JSON.stringify(settings.socialBanner) !== JSON.stringify(originalSettings.socialBanner)) {
        updates["content.socialBanner"] = JSON.stringify(settings.socialBanner);
      }
      if (JSON.stringify(settings.footerBranding) !== JSON.stringify(originalSettings.footerBranding)) {
        updates["content.footerBranding"] = JSON.stringify(settings.footerBranding);
      }
      if (JSON.stringify(settings.footerContactInfo) !== JSON.stringify(originalSettings.footerContactInfo)) {
        updates["content.footerContactInfo"] = JSON.stringify(settings.footerContactInfo);
      }
      if (JSON.stringify(settings.faqData) !== JSON.stringify(originalSettings.faqData)) {
        updates["content.faqData"] = JSON.stringify(settings.faqData);
      }
      if (JSON.stringify(settings.emergencyHotlines) !== JSON.stringify(originalSettings.emergencyHotlines)) {
        updates["content.emergencyHotlines"] = JSON.stringify(settings.emergencyHotlines);
      }
      if (JSON.stringify(settings.aboutTabs) !== JSON.stringify(originalSettings.aboutTabs)) {
        updates["content.aboutTabs"] = JSON.stringify(settings.aboutTabs);
      }
      if (JSON.stringify(settings.aboutTabContents) !== JSON.stringify(originalSettings.aboutTabContents)) {
        updates["content.aboutTabContents"] = JSON.stringify(settings.aboutTabContents);
      }
      if (JSON.stringify(settings.statsData) !== JSON.stringify(originalSettings.statsData)) {
        updates["content.statsData"] = JSON.stringify(settings.statsData);
      }
      if (JSON.stringify(settings.aboutSectionData) !== JSON.stringify(originalSettings.aboutSectionData)) {
        updates["content.aboutSectionData"] = JSON.stringify(settings.aboutSectionData);
      }
      if (JSON.stringify(settings.eventsData) !== JSON.stringify(originalSettings.eventsData)) {
        updates["content.eventsData"] = JSON.stringify(settings.eventsData);
      }
      if (JSON.stringify(settings.colorTheme) !== JSON.stringify(originalSettings.colorTheme)) {
        updates["content.colorTheme"] = JSON.stringify(settings.colorTheme);
      }
      if (settings.logoUrl !== originalSettings.logoUrl) {
        updates["brand.logo"] = settings.logoUrl;
        updates["content.logoUrl"] = settings.logoUrl;
      }
      if (settings.loginBackgroundUrl !== originalSettings.loginBackgroundUrl) {
        updates["brand.loginBackground"] = settings.loginBackgroundUrl || '';
        updates["content.loginBackgroundUrl"] = settings.loginBackgroundUrl || '';
      }

      if (Object.keys(updates).length === 0) {
        setHasUnsavedChanges(false);
        setLoading(false);
        return;
      }

      await settingsService.updateSettings(updates);
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save all settings:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const discardChanges = useCallback(() => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setHasUnsavedChanges(false);
    }
  }, [originalSettings]);

  return (
    <WebsiteSettingsContext.Provider value={{ 
      settings, originalSettings, loading, refreshSettings: fetchSettings,
      editMode, setEditMode, hasUnsavedChanges, updateSettingLocal, saveAllSettings, discardChanges
    }}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export const useWebsiteSettings = () => useContext(WebsiteSettingsContext);
