import React from 'react'
import { resolveAssetUrl } from '@/utils/assetUrl'

interface AuthLayoutProps {
  children: React.ReactNode
  backgroundImage?: string
}

export function AuthLayout({ children, backgroundImage }: AuthLayoutProps) {
  const bg = resolveAssetUrl(backgroundImage, '/assets/3s-center-new.jpg')

  return (
    <div className="min-h-screen h-screen overflow-hidden w-full relative flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Full-width Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('${bg}')` }}
      />
      
      {/* Brand-consistent Vibrant Blue-Slate Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/50 to-[#2563eb]/40 z-0" />

      {/* Centered Modal Container */}
      <div className="relative z-10 w-full flex items-center justify-center max-h-full overflow-y-auto py-6">
        {children}
      </div>
    </div>
  )
}
