import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Contact } from "./Contact";

export const ContactPage = () => {
  useEffect(() => {
    document.title = "Contact Barangay Ugong | SerbisyoKo";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Contact Barangay Ugong in Valenzuela City for office information, location, telephone numbers, email details, office hours, and public inquiries.");
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", "https://serbisyoko-3scbuvc-portal.com/contact");
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://serbisyoko-3scbuvc-portal.com/contact');
      document.head.appendChild(canonical);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Navbar />
      <main className="flex-grow">
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
