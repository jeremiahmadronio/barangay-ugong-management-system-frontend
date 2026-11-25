import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Calendar,
  Shield,
  Home,
  Heart,
} from "lucide-react";

export interface HeroContent {
  kicker: string;
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  backgroundImage: string;
}

export interface StatItem {
  icon: LucideIcon;
  value: string;
  label: string;
}

export interface AboutTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface AboutCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface AboutTabContent {
  cards: AboutCard[];
}



export interface EventItem {
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
}

export interface ContactCard {
  icon: LucideIcon;
  title: string;
  primaryText: string;
  secondaryText: string;
}

export interface SocialBanner {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterBranding {
  logoSrc: string;
  name: string;
  tagline: string;
  description: string;
  socialLinks: { icon: string; href: string }[];
}

export interface FooterContactItem {
  icon: LucideIcon;
  iconName?: string;
  text: string;
}

export const heroContent: HeroContent = {
  kicker: "OFFICIAL BARANGAY PORTAL",
  title: "Barangay Ugong",
  subtitle: "City of Valenzuela",
  description:
    "Access official announcements, document requirements, and barangay updates all in one trusted platform.",
  primaryButtonText: "View Requirements",
  secondaryButtonText: "Contact Us",
  backgroundImage: "/assets/Barangay landing.jpg",
};

export const statsItems: StatItem[] = [
  { icon: Users, value: "50,000+", label: "Residents Served" },
  { icon: MapPin, value: "15", label: "Puroks Covered" },
  { icon: Calendar, value: "1963", label: "Established" },
  { icon: Clock, value: "24/7", label: "Ready to Serve" },
];

export const aboutTabs: AboutTab[] = [
  { id: "vision-mission", label: "Vision & Mission", icon: Shield },
  { id: "history", label: "Our History", icon: Calendar },
  { id: "purpose", label: "Our Purpose", icon: Heart },
];

export const aboutTabContents: Record<string, AboutTabContent> = {
  "vision-mission": {
    cards: [
      {
        icon: Shield,
        title: "Our Vision",
        description:
          "A progressive, disaster-resilient, and united Barangay Ugong where every household enjoys safe streets, accessible health care, and a local government they can see, question, and trust.",
      },
      {
        icon: Heart,
        title: "Our Mission",
        description:
          "To deliver prompt and courteous frontline services, to spend every peso of barangay funds transparently, and to bring programs closer to residents through empowered purok leaders and open community assemblies.",
      },
    ],
  },
  history: {
    cards: [
      {
        icon: Calendar,
        title: "Our Roots",
        description:
          "Barangay Ugong was established in 1963 as one of the original barangays of Valenzuela. From humble beginnings, it has grown into a thriving community of over 50,000 residents across 15 puroks.",
      },
      {
        icon: Home,
        title: "Growth & Progress",
        description:
          "Over six decades, Ugong has transformed from a quiet residential area into a vibrant community with modern facilities, including the 3S Center that serves as the hub for all barangay services.",
      },
    ],
  },
  purpose: {
    cards: [
      {
        icon: Users,
        title: "Community First",
        description:
          "Every program, service, and initiative is designed with the welfare of our residents in mind. We prioritize transparency, accountability, and inclusivity in all our operations.",
      },
      {
        icon: Shield,
        title: "Public Service Excellence",
        description:
          "We continuously improve our processes to deliver faster, more efficient services. From document processing to community programs, we aim to set the standard for barangay governance.",
      },
    ],
  },
};



export const upcomingEvents: EventItem[] = [
  {
    date: "2026-09-05",
    title: "Quarterly Barangay Assembly",
    description:
      "Open reporting of the barangay budget, ongoing projects, and the disaster preparedness plan. All residents are encouraged to attend and raise concerns.",
    startTime: "09:00",
    endTime: "12:00",
    location: "Ugong Covered Court",
  },
  {
    date: "2026-09-12",
    title: "Free Medical & Dental Mission",
    description:
      "Consultation, basic laboratory screening, tooth extraction, and free maintenance medicines for senior citizens and indigent households.",
    startTime: "08:00",
    endTime: "17:00",
    location: "Barangay Health Center",
  },
  {
    date: "2026-09-21",
    title: "Ugong Sports Festival Opening",
    description:
      "Parade of the 15 puroks, oath of sportsmanship, and the opening basketball and volleyball games of the annual inter-purok league.",
    startTime: "15:00",
    endTime: "",
    location: "Ugong Covered Court",
  },
];

export const contactCards: ContactCard[] = [
  {
    icon: MapPin,
    title: "Location",
    primaryText: "Barangay Hall, M.H. del Pilar St.",
    secondaryText: "Ugong, Valenzuela City 1440",
  },
  {
    icon: Phone,
    title: "Call Us",
    primaryText: "(02) 8292-4471",
    secondaryText: "0917 845 2210 (Globe)",
  },
  {
    icon: Mail,
    title: "Email Us",
    primaryText: "info@barangayugong.gov.ph",
    secondaryText: "Replies within 2 working days",
  },
  {
    icon: Clock,
    title: "Office Hours",
    primaryText: "Mon – Fri, 8:00 AM – 5:00 PM",
    secondaryText: "VAWC desk open 24/7",
  },
];

export const socialBanner: SocialBanner = {
  title: "Connect with us online",
  description:
    "Daily advisories, weather bulletins, and program updates are posted on our official Facebook page.",
  buttonText: "Barangay Ugong Valenzuela City",
  buttonLink: "https://www.facebook.com/barangayugongvalenzuelacity",
};

export const footerBranding: FooterBranding = {
  logoSrc: "/assets/ugong-logo.png",
  name: "BARANGAY UGONG",
  tagline: "LUNGSOD NG VALENZUELA",
  description:
    "The official information and transparency portal of Barangay Ugong — publishing services, announcements, and community updates for every resident.",
  socialLinks: [
    {
      icon: "facebook",
      href: "https://www.facebook.com/barangayugongvalenzuelacity",
    },
    {
      icon: "instagram",
      href: "https://www.instagram.com/barangayugong",
    },
  ],
};

export const footerQuickLinks: FooterColumn = {
  title: "QUICK LINKS",
  links: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/#about" },
    { label: "Services", href: "/services" },
    { label: "Announcements", href: "/announcements" },
    { label: "Events", href: "/events" },
    { label: "Officials", href: "/officials" },
    { label: "Contact", href: "/contact" },
    { label: "FAQs", href: "/faq" },
  ],
};

export const footerDocumentTypes: FooterColumn = {
  title: "DOCUMENT TYPES",
  links: [
    { label: "Barangay Clearance", href: "/services" },
    { label: "Certificate of Residency", href: "/services" },
    { label: "Business Permit", href: "/services" },
    { label: "Barangay ID", href: "/services" },
    { label: "Certificate of Indigency", href: "/services" },
    { label: "Barangay Protection Order", href: "/services" },
  ],
};

export const footerContactInfo: FooterContactItem[] = [
  {
    icon: MapPin,
    iconName: "MapPin",
    text: "Barangay Ugong Hall, M.H. del Pilar St., Barangay Ugong, Valenzuela City 1440",
  },
  {
    icon: Phone,
    iconName: "Phone",
    text: "(02) 8291-4567\nHotline 0917 555 8823",
  },
  {
    icon: Mail,
    iconName: "Mail",
    text: "barangayugong@valenzuela.gov.ph",
  },
];

export interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

export const faqData: FAQItem[] = [
  {
    category: "General",
    question: "What are the operating hours of the Barangay Hall?",
    answer: "The Barangay Ugong Hall is open from Monday to Friday, 8:00 AM to 5:00 PM. We are closed on weekends and regular holidays."
  },
  {
    category: "General",
    question: "How can I contact the Barangay Hall for emergencies?",
    answer: "For emergencies, you can call our hotline at (02) 8291-4567 or 0917 555 8823. Our response team is available 24/7 for urgent matters."
  },
  {
    category: "Documents & Requirements",
    question: "How long does it take to get a Barangay Clearance?",
    answer: "Barangay Clearance is typically processed on the same day within 15-30 minutes, provided you have submitted all the necessary requirements."
  },
  {
    category: "Documents & Requirements",
    question: "Do I need to appear in person to request a document?",
    answer: "Yes, personal appearance is required for most documents, especially those requiring your signature or thumbmark. However, if you are unable to come, a representative with an Authorization Letter and valid IDs may claim certain documents."
  },
  {
    category: "Office Hours & Location",
    question: "Where is the Barangay Hall located?",
    answer: "We are located at Barangay Ugong Hall, M.H. del Pilar St., Barangay Ugong, Valenzuela City."
  },
  {
    category: "Community Programs",
    question: "How do I register as a First Time Job Seeker?",
    answer: "You must bring an Oath of Undertaking, a valid ID, and a 2x2 ID picture to the Barangay Hall to secure a First Time Job Seeker Certificate."
  }
];

export interface EmergencyHotline {
  name: string;
  number: string;
  icon: string; // We'll use this to determine the icon to render
}

export const emergencyHotlines: EmergencyHotline[] = [
  { name: "Barangay Hotlines", number: "(02) 8291-4567\n0917 555 8823", icon: "phone" },
  { name: "Valenzuela Rescue", number: "(02) 8292-1405\n(02) 8352-2000", icon: "ambulance" },
  { name: "Police Sub-station", number: "(02) 8294-8255", icon: "shield" },
  { name: "Fire Department", number: "(02) 8292-8070", icon: "flame" }
];
