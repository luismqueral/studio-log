'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
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
  const textRef = useRef<HTMLDivElement>(null)
  const [isTextReady, setIsTextReady] = useState(variant === 'nav') // Nav is always ready, hero starts as not ready
  const [isFirstLoad, setIsFirstLoad] = useState(true) // Track if this is the first load

  const fonts = [
    'font-times-bold', 
    'font-comic-bold', 
    'font-blackletter', 
    'font-helvetica-bold',
    'font-galapagos'
  ]

  // Galapagos variant selection - pick one per refresh
  const galapagosVariants = ['galapagos-a', 'galapagos-ab', 'galapagos-abc']
  const [currentGalapagosVariant, setCurrentGalapagosVariant] = useState(
    galapagosVariants[Math.floor(Math.random() * galapagosVariants.length)]
  )

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

  // Configuration for character rotation randomization
  const ROTATION_CONFIG = {
    maxRotation: 8,        // Maximum rotation in degrees (±8°)
    noRotationChance: 0.4, // 40% chance for no rotation
    subtleRotationChance: 0.5, // 50% chance for subtle rotation (±3°)
    boldRotationChance: 0.1    // 10% chance for bold rotation (±8°)
  }

  const generateCharacterRotation = (): number => {
    const rand = Math.random()
    
    // 40% chance: No rotation at all
    if (rand < ROTATION_CONFIG.noRotationChance) {
      return 0
    }
    
    // 50% chance: Subtle rotation (±3 degrees)
    if (rand < ROTATION_CONFIG.noRotationChance + ROTATION_CONFIG.subtleRotationChance) {
      return (Math.random() - 0.5) * 6 // ±3 degrees
    }
    
    // 10% chance: Bold rotation (±8 degrees)
    return (Math.random() - 0.5) * (ROTATION_CONFIG.maxRotation * 2) // ±8 degrees
  }

  const scaleTextToFit = useCallback(() => {
    if (!containerRef.current || !textRef.current || variant !== 'hero') return

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      const container = containerRef.current
      const textElement = textRef.current
      if (!container || !textElement) return
      
      const h1Element = textElement.querySelector('h1') as HTMLElement
      if (!h1Element) return

      // Get container dimensions (accounting for padding and border)
      const containerRect = container.getBoundingClientRect()
      const containerStyle = window.getComputedStyle(container)
      const borderWidth = parseFloat(containerStyle.borderLeftWidth) + parseFloat(containerStyle.borderRightWidth)
      const paddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight)
      const paddingY = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom)
      
      const availableWidth = containerRect.width - borderWidth - paddingX
      const availableHeight = containerRect.height - paddingY
      
      // Batch DOM updates to prevent layout thrashing
      h1Element.style.fontSize = ''
      h1Element.style.transform = 'scale(1)'
      
      // Set a base font size that's proportional to container size
      const baseFontSize = Math.min(availableWidth, availableHeight) * 0.25 // 25% of container's smaller dimension
      h1Element.style.fontSize = `${baseFontSize}px`
      
      // Use another requestAnimationFrame for measurement after font application
      requestAnimationFrame(() => {
        const textRect = h1Element.getBoundingClientRect()
        
        // Calculate scale to fit within container if needed
        const scaleX = availableWidth / textRect.width
        const scaleY = availableHeight / textRect.height
        const scale = Math.min(scaleX, scaleY, 1) // Only scale down, never up
        
        // Apply additional scaling if needed
        if (scale < 1) {
          h1Element.style.transform = `scale(${scale * 0.95})` // 5% margin for safety
        }
        
        // Mark text as ready after sizing is complete
        if (variant === 'hero') {
          setIsTextReady(true)
        }
      })
    })
   }, [variant])

  const applyRandomization = useCallback((isManualClick = false) => {
    if (!logoRef.current || !containerRef.current) return

    // Only show skeleton on first load, not on manual clicks to prevent flicker
    if (variant === 'hero' && isFirstLoad && !isManualClick) {
      setIsTextReady(false)
    }

    // Pick a new Galapagos variant for this randomization
    const selectedGalapagosVariant = galapagosVariants[Math.floor(Math.random() * galapagosVariants.length)]
    setCurrentGalapagosVariant(selectedGalapagosVariant)

    // Random logo font assignment and character rotation
    const logoSpans = logoRef.current.querySelectorAll('span') as NodeListOf<HTMLSpanElement>
    logoSpans.forEach((span, index) => {
      const randomFont = fonts[Math.floor(Math.random() * fonts.length)]
      
      // Handle Galapagos variant selection
      if (randomFont === 'font-galapagos') {
        span.className = selectedGalapagosVariant
      } else {
        span.className = randomFont
      }
      
      // Apply character rotation only for hero variant
      if (variant === 'hero') {
        const rotation = generateCharacterRotation()
        span.style.display = 'inline-block'
        span.style.transform = `rotate(${rotation}deg)`
        span.style.transformOrigin = 'center center'
      } else {
        // Nav variant: no rotation, normal display
        span.style.display = 'inline'
        span.style.transform = 'none'
        span.style.transformOrigin = 'initial'
      }
      
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
    
    // Apply container-relative scaling after randomization (only for hero variant)
    if (variant === 'hero') {
      scaleTextToFit() // Direct call instead of setTimeout for faster response
    }
    
    // Mark first load as complete
    if (isFirstLoad) {
      setIsFirstLoad(false)
    }
  }, [variant, fonts, scaleTextToFit, galapagosVariants, isFirstLoad])

  const handleClick = () => {
    applyRandomization(true) // Mark as manual click
    if (onClick) {
      onClick()
    }
  }

  useEffect(() => {
    applyRandomization(false) // Initial load, not a manual click
    
    // Add resize listener for responsive scaling
    const handleResize = () => {
      if (variant === 'hero') {
        scaleTextToFit() // Direct call for better performance
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [applyRandomization, variant, scaleTextToFit])

  if (variant === 'nav') {
    return (
      <div 
        ref={containerRef}
        className={`cursor-pointer select-none br2 ${className}`}
        onClick={handleClick}
        style={{
          // Skinnier nav logo without rotation
          width: 'auto',
          minWidth: '120px',
          border: '3px solid #000',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          transition: 'box-shadow 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
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
        <div 
          style={{ 
            whiteSpace: 'nowrap'
          }}
        >
          <Link 
            href={href} 
            className="link no-underline"
            style={{ 
              textDecoration: 'none !important',
              display: 'inline-block'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none'
            }}
          >
            <h1 className="f1 ma0 gray" style={{
              userSelect: 'none',
              WebkitUserSelect: 'none', 
              MozUserSelect: 'none',
              msUserSelect: 'none',
              pointerEvents: 'none',
              WebkitFontSmoothing: 'none',
              MozOsxFontSmoothing: 'unset',
              fontSmooth: 'never'
            }}>
              <span ref={logoRef}>
                <span>s</span><span>t</span><span>u</span><span>d</span><span>i</span><span>o</span><span> </span><span>q</span><span>u</span><span>e</span><span>r</span><span>a</span><span>l</span>
              </span>
            </h1>
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <>
        <style jsx>{`
          .hero-logo-container {
            width: 70% !important;
            max-width: 500px !important;
          }
          
          /* Shimmer animation for skeleton loader */
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          /* Fallback for 4:3 aspect ratio on browsers without aspect-ratio support */
          @supports not (aspect-ratio: 4 / 3) {
            .hero-logo-container::before {
              content: '';
              width: 1px;
              margin-left: -1px;
              float: left;
              height: 0;
              padding-bottom: 75%; /* 4:3 = 75% */
            }
            .hero-logo-container::after {
              content: '';
              display: table;
              clear: both;
            }
          }
          
          @media screen and (min-width: 30em) {
            .hero-logo-container {
              width: 65% !important;
            }
          }
          
          @media screen and (min-width: 48em) {
            .hero-logo-container {
              width: 60% !important;
            }
          }
          
          @media screen and (min-width: 64em) {
            .hero-logo-container {
              width: 55% !important;
            }
          }
        `}</style>
        <header 
          ref={containerRef}
          className={`tc cursor-pointer select-none br2 hero-logo-container ${className}`}
          onClick={handleClick}
          style={{
            // Strict 4:3 aspect ratio enforcement
            aspectRatio: '4 / 3',
            width: '400px', // Conservative fixed width before CSS loads
            maxWidth: '500px', // Inline constraint to prevent flash
            margin: '0 auto 1.5rem',
            border: '6px solid #000',
            padding: 'clamp(0.75rem, 3vw, 2rem)',
            transition: 'box-shadow 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
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
          {/* Skeleton loader - only show on first load */}
          {!isTextReady && isFirstLoad && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <div 
                style={{
                  width: '80%',
                  height: '60%',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  borderRadius: '8px',
                  opacity: 0.7
                }}
              />
            </div>
          )}
          
          <div 
            ref={textRef}
            style={{ 
              transformOrigin: 'center center',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isTextReady ? 1 : 0
            }}
          >
            <h1 
              className="ma0 lh-solid" 
              style={{ 
                fontSize: '2rem', // More reasonable initial size
                transform: 'scale(1)',
                lineHeight: '0.9',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                pointerEvents: 'none',
                WebkitFontSmoothing: 'none',
                MozOsxFontSmoothing: 'unset',
                fontSmooth: 'never'
              }}
            >
              <span 
                ref={logoRef}
                className="link no-underline"
                style={{ 
                  outline: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  pointerEvents: 'none'
                }}
                tabIndex={-1}
              >
                <span>S</span><span>t</span><span>u</span><span>d</span><span>i</span><span>o</span><br />
                <span>Q</span><span>u</span><span>e</span><span>r</span><span>a</span><span>l</span>
              </span>
            </h1>
          </div>
        </header>
      </>
    )
  }

  // Default return for unknown variants
  return null
} 