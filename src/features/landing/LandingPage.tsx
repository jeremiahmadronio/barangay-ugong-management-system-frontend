import { useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from '@/features/landing/Navbar'
import { Hero } from '@/features/landing/Hero'
import { About } from '@/features/landing/About'
import { Services } from '@/features/landing/Services'
import { Officials } from '@/features/landing/Officials'
import { SocialMedia } from '@/features/landing/SocialMedia'
import { Contact } from '@/features/landing/Contact'
import { Footer } from '@/features/landing/Footer'

export const LandingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const officialsRef = useRef<HTMLDivElement>(null)
  const socialRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    hero: heroRef,
    about: aboutRef,
    services: servicesRef,
    officials: officialsRef,
    social: socialRef,
    contact: contactRef,
  }

  const scrollToSection = (section: string) => {
    const targetRef = refs[section]
    if (targetRef?.current) {
      const offset = 100
      const elementPosition = targetRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const section = location.hash.replace('#', '')
    scrollToSection(section)
  }, [location.hash])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div ref={heroRef}>
        <Hero onNavigate={scrollToSection} />
      </div>
      <div ref={aboutRef}>
        <About />
      </div>
      <div ref={servicesRef}>
        <Services />
      </div>
      <div ref={officialsRef}>
        <Officials />
      </div>
      <div ref={socialRef}>
        <SocialMedia />
      </div>
      <div ref={contactRef}>
        <Contact />
      </div>
      <Footer onNavigate={scrollToSection} />
    </div>
  )
}

export default LandingPage
