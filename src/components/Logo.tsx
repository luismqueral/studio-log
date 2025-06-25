'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

interface LogoProps {
  variant?: 'nav' | 'hero'
  className?: string
  onClick?: () => void
  href?: string
}

interface ColorScheme {
  backgroundColor: string
  borderColor: string
  hoverBorderColor: string
  activeBorderColor: string
  textColor: string
}

export default function Logo({ 
  variant = 'nav', 
  className = '', 
  onClick,
  href = '/'
}: LogoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLElement>(null)

  const fonts = [
    'font-comic', 
    'font-blackletter', 
    'font-times', 
    'font-helvetica-bold', 
    'font-galapagos'
  ]

  const generateRandomColors = (): ColorScheme => {
    // Generate random light background color
    const hue = Math.floor(Math.random() * 360)
    const saturation = Math.floor(Math.random() * 30) + 10 // 10-40% saturation
    const lightness = Math.floor(Math.random() * 15) + 85 // 85-100% lightness
    
    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    const borderColor = `hsl(${hue}, ${saturation + 15}%, ${lightness - 15}%)`
    const hoverBorderColor = `hsl(${hue}, ${saturation + 20}%, ${lightness - 25}%)`
    const activeBorderColor = `hsl(${hue}, ${saturation + 30}%, ${lightness - 35}%)`
    
    // Calculate contrasting text color
    const textLightness = lightness > 90 ? 20 : 30 // Darker text for lighter backgrounds
    const textColor = `hsl(${hue}, ${saturation + 10}%, ${textLightness}%)`
    
    return { backgroundColor, borderColor, hoverBorderColor, activeBorderColor, textColor }
  }

  const applyRandomization = () => {
    if (!logoRef.current || !containerRef.current) return

    // Random logo font assignment
    const logoSpans = logoRef.current.querySelectorAll('span') as NodeListOf<HTMLSpanElement>
    logoSpans.forEach((span, index) => {
      const randomFont = fonts[Math.floor(Math.random() * fonts.length)]
      span.className = randomFont
      
      // Randomly choose uppercase or lowercase for the first letter
      if (index === 0) {
        span.textContent = Math.random() < 0.5 ? 
          (variant === 'hero' ? 'S' : 's') : 
          (variant === 'hero' ? 's' : 'S')
      }
    })
    
    // Random background and border colors
    const colors = generateRandomColors()
    const container = containerRef.current
    const logo = logoRef.current
    
    container.style.backgroundColor = colors.backgroundColor
    container.style.borderColor = colors.borderColor
    logo.style.color = colors.textColor
    
    // Store colors as custom properties for hover/active states
    container.style.setProperty('--border-color', colors.borderColor)
    container.style.setProperty('--hover-border-color', colors.hoverBorderColor)
    container.style.setProperty('--active-border-color', colors.activeBorderColor)
  }

  const handleClick = () => {
    applyRandomization()
    if (onClick) {
      onClick()
    }
  }

  useEffect(() => {
    applyRandomization()
  }, [])

  if (variant === 'nav') {
    return (
      <div 
        ref={containerRef}
        className={`inline-block cursor-pointer select-none br2 ${className}`}
        onClick={handleClick}
        style={{
          border: '3px solid #000',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          width: 'auto',
          maxWidth: 'fit-content'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
          const hoverColor = e.currentTarget.style.getPropertyValue('--hover-border-color')
          if (hoverColor) {
            e.currentTarget.style.borderColor = hoverColor
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = e.currentTarget.style.getPropertyValue('--border-color') || '#000'
        }}
        onMouseDown={(e) => {
          const activeColor = e.currentTarget.style.getPropertyValue('--active-border-color')
          if (activeColor) {
            e.currentTarget.style.borderColor = activeColor
          }
        }}
        onMouseUp={(e) => {
          const hoverColor = e.currentTarget.style.getPropertyValue('--hover-border-color')
          if (hoverColor) {
            e.currentTarget.style.borderColor = hoverColor
          }
        }}
      >
        <h1 className="f2 ma0 gray" style={{ display: 'inline-block', width: 'auto' }}>
          <Link 
            href={href} 
            className="link no-underline"
            style={{ 
              transition: 'color 0.2s ease, transform 0.1s ease',
              textDecoration: 'none !important',
              display: 'inline-block',
              width: 'auto',
              whiteSpace: 'nowrap'
            }}
            onFocus={(e) => {
              e.currentTarget.style.transform = 'translateY(1px)'
              e.currentTarget.style.outline = 'none'
            }}
            onBlur={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span ref={logoRef}>
              <span>s</span><span>t</span><span>u</span><span>d</span><span>i</span><span>o</span><span> </span><span>q</span><span>u</span><span>e</span><span>r</span><span>a</span><span>l</span>
            </span>
          </Link>
        </h1>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <header 
        ref={containerRef}
        className={`tc mw7 center mb3 br2 cursor-pointer select-none ${className}`}
        onClick={handleClick}
        style={{
          border: '6px solid #000',
          padding: 'clamp(2rem, 8vw, 5rem)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)'
          const hoverColor = e.currentTarget.style.getPropertyValue('--hover-border-color')
          if (hoverColor) {
            e.currentTarget.style.borderColor = hoverColor
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = e.currentTarget.style.getPropertyValue('--border-color') || '#000'
        }}
        onMouseDown={(e) => {
          const activeColor = e.currentTarget.style.getPropertyValue('--active-border-color')
          if (activeColor) {
            e.currentTarget.style.borderColor = activeColor
          }
        }}
        onMouseUp={(e) => {
          const hoverColor = e.currentTarget.style.getPropertyValue('--hover-border-color')
          if (hoverColor) {
            e.currentTarget.style.borderColor = hoverColor
          }
        }}
      >
        <h1 
          className="ma0 lh-solid" 
          style={{ fontSize: 'clamp(3rem, 12vw, 10rem)' }}
        >
          <span 
            ref={logoRef}
            className="link no-underline"
            style={{ outline: 'none' }}
            tabIndex={-1}
          >
            <span>S</span><span>t</span><span>u</span><span>d</span><span>i</span><span>o</span><br />
            <span>Q</span><span>u</span><span>e</span><span>r</span><span>A</span><span>l</span>
          </span>
        </h1>
      </header>
    )
  }

  // Default return for unknown variants
  return null
} 