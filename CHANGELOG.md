# Studio Log Generator - Change Log

This document tracks all significant changes to the studio log system in plain English.

## 2025-01-25

- disabled font smoothing across all logo variants - added WebkitFontSmoothing: 'none', MozOsxFontSmoothing: 'unset', and fontSmooth: 'never' to both nav and hero logo h1 elements for sharper, more defined text rendering that maintains font character
- removed click animations and transitions from logo interactions - eliminated transform/translateY animations on nav logo link focus/blur/mouseDown/mouseUp events, removed opacity transition from hero logo text fade-in, and removed color/transform transitions from nav logo hover states while preserving the shadow hover effect behind the logo container
- preserved shadow hover states on logo containers - maintained the subtle box-shadow transitions (0.2s ease) and border-color changes that provide visual feedback without interfering with the crisp font rendering
- removed border-color transition on click - changed transition from 'box-shadow 0.2s ease, border-color 0.2s ease' to just 'box-shadow 0.2s ease' on both nav and hero variants, making border color changes instant while keeping smooth shadow hover effects
- added Inter as default body font - loaded Inter from Google Fonts with weights 300-700, created .font-inter CSS class with proper fallback stack and OpenType features (cv02, cv03, cv04, cv11), updated body from sans-serif to font-inter class, excluded Inter from logo font randomization to maintain current logo variety
- changed webkit font smoothing to auto site-wide - updated all font classes from -webkit-font-smoothing: antialiased to auto and -moz-osx-font-smoothing: grayscale to auto across Inter body font and all 14 logo font classes, making fonts thicker and more defined without browser anti-aliasing

## 2024-12-25

- enhanced font cross-browser compatibility for logo randomization - improved font definitions in public/assets/css/custom.css with proper iOS fallbacks for all font classes used in Logo component
- added mobile-optimized font stacks for better iPhone support - font-comic now includes 'Chalkboard SE' and 'Marker Felt' iOS fallbacks, font-blackletter includes serif fallbacks since Lucida Blackletter isn't available on iOS
- implemented font smoothing and performance optimizations - added -webkit-font-smoothing: antialiased and -moz-osx-font-smoothing: grayscale to all font classes for crisp rendering on retina displays
- updated layout.tsx with mobile font optimization headers - added preconnect hints and proper viewport meta tags to improve font loading performance on mobile devices
- fixed font fallback chains for system compatibility - helvetica-bold now includes -apple-system and San Francisco fonts for better iOS integration, times includes Liberation Serif for Linux compatibility
- included all custom fonts from tachyons-ext.css - added tachyons-ext.css to layout.tsx to load @font-face declarations for Comic Sans MS, Lucida Blackletter, Brush Script, Algerian, Davida, Curlz, Relinquish, and Hobo Std fonts
- expanded logo font randomization with 7 additional fonts - updated Logo component to include font-brush-script, font-algerian, font-davida, font-curlz, font-relinquish, and font-hobo for more diverse typographic variety
- created fonts directory structure - added public/assets/fonts/ directory to house custom font files, ready for font file uploads when available
- processed and optimized Times New Roman font files - renamed TTF files to follow proper naming convention (TimesNewRoman-Regular, TimesNewRoman-Bold, TimesNewRoman-Italic, TimesNewRoman-BoldItalic)
- converted Times New Roman fonts to web formats - used fonttools to convert all 4 Times New Roman TTF variants to both WOFF and WOFF2 formats for optimal web performance and browser compatibility
- added complete Times New Roman @font-face declarations - updated tachyons-ext.css with proper font-face rules for all Times New Roman variants (regular, bold, italic, bold-italic) with font-display: swap for performance
- cleaned up font file structure - removed original TTF files after conversion, keeping only web-optimized WOFF/WOFF2 versions for production use
- refined logo font selection to 5 core typefaces - limited randomization to Times New Roman Bold, Comic Sans Bold, Lucida Blackletter, Helvetica Bold, and Galapagos for more focused and cohesive brand expression
- implemented Galapagos variant system - added logic to randomly select one of three Galapagos variants (galapagos-a, galapagos-ab, galapagos-abc) per refresh and apply consistently across all characters, preventing mixing of variants within single logo instance
- added font-times-bold and font-comic-bold CSS classes - created dedicated bold versions of Times New Roman and Comic Sans with proper font-weight declarations and cross-browser fallbacks for improved typographic consistency
- included Helvetica Bold in logo font rotation - added font-helvetica-bold to the randomization mix for additional typographic variety while maintaining focus on core brand typefaces
- adjusted Times New Roman relative sizing in logo context - added font-size: 1.05em to font-times-bold class to make Times New Roman letters 5% larger than other fonts for better visual balance and prominence
- optimized logo refresh performance to eliminate flickers - replaced setTimeout with requestAnimationFrame for smoother updates, prevented skeleton loader from showing on manual clicks (only first load), removed overlapping timing conflicts, and added CSS preloading to prevent flash of unstyled text
- improved DOM update batching in text scaling - used dual requestAnimationFrame pattern to prevent layout thrashing and ensure smooth font size calculations without performance bottlenecks

## 2024-12-22

- Implemented modular randomized Logo component for Next.js app - created src/components/Logo.tsx with interactive font randomization, color generation, and variant support for nav vs hero usage
- Converted HTML template navigation design to React components - updated src/app/layout.tsx with new Logo component, matching navigation structure, and proper tachyons styling from templates
- Added missing font classes to CSS for logo randomization - extended public/assets/css/custom.css with font-comic, font-blackletter, font-times, font-helvetica-bold, and font-galapagos classes
- Enhanced layout with proper responsive design and background - updated layout.tsx to use bg-light-gray background, responsive padding (pa3 pa4-ns), and centered header matching HTML template designs
- Preserved creative randomization logic from HTML templates - Logo component maintains character-by-character font mixing, random color generation, and click-to-randomize functionality in TypeScript
- Created hero homepage matching home.html template exactly - implemented /home route with large Studio Queral logo using hero variant of Logo component, includes responsive clamp-based sizing and 6px border styling
- Added custom layout for home page - created src/app/home/layout.tsx with smaller navigation (f6 f4-ns) and no highlighted current page to match home.html design perfectly
- Implemented home page content section - added bio text with proper link styling and responsive typography (f6 f4-ns) in measure-wide container matching HTML template structure
- Restructured routing for proper homepage hierarchy - moved hero homepage from /home to root /, moved studio log posts from / to /studio-log, updated all navigation links accordingly
- Created custom layouts for different page types - root layout.tsx shows home-style navigation without nav logo, studio-log/layout.tsx shows traditional navigation with nav logo and highlighted current page
- Cleaned up old routing structure - removed deprecated /home directory and updated Logo component hrefs to point to proper routes
- Fixed duplicate navigation UI bug - removed navigation from root layout and moved home-style navigation into homepage component, eliminating duplicate navigation on studio-log page
- Simplified layout architecture - root layout now only provides HTML structure, each page handles its own navigation independently to prevent conflicts
- Fixed nav logo sizing to hug text content - removed wrapper div around Logo component in studio-log layout, allowing inline-block nav logo to center properly and match HTML template sizing
- Improved nav logo text hugging - added display inline-block to h1 and Link elements within nav Logo component, ensuring the logo container wraps tightly around text content without extra width
- Fixed nav logo width to truly hug text content - added width auto, maxWidth fit-content to container and whiteSpace nowrap to text elements, eliminating excessive width and matching HTML template exactly
- Properly centered nav logo in header - wrapped Logo component in flexbox container with justify-center to ensure perfect centering regardless of logo width variations
- Enhanced PostList styling to match HTML templates exactly - updated article containers with white card backgrounds (bg-white), proper padding (pa3 pa4-ns), margins (mb4 mb5-ns), and border radius (br2)
- Updated post typography to match template scale - date uses f7 f6-ns, title uses f4 f3-ns lh-title, content uses f6 f5-ns lh-copy, matching responsive design patterns
- Improved post header structure - proper spacing with mb3 mb3-ns on headers and mb3 mb3-ns on date elements, title links use underline-hover instead of hover-blue
- Updated Tags component styling - removed "Tags:" label, changed to rectangular pills (br2) instead of round (br-pill), smaller text (f7 f6-ns), matching template hover states
- Added proper image styling in MarkdownRenderer - images now wrapped in figure elements with ba b--light-gray bw2 br2 border styling and optional figcaptions
- Removed post separators between articles - eliminated hr elements to match clean template design without dividers
- Implemented individual post page layout matching post.html template - updated [slug]/page.tsx with white card styling (bg-white pa3 pa4-ns), proper typography scales, and measure-wide content area
- Added post navigation with Previous/Next links - footer section with hover-underline styling and responsive typography (f6 f5-ns), simplified to generic "Previous Post" / "Next Post" labels
- Created layout for individual post pages - [slug]/layout.tsx with same navigation structure as studio-log but highlighting "studio log" tab for consistency
- Implemented projects page stub - created /projects route with simple placeholder content and proper card styling, ready for future project content
- Created projects page layout - projects/layout.tsx with navigation highlighting "projects" tab and matching design patterns
- Implemented about page with content from HTML template - copied biography structure from about.html including image placeholder, professional/creative/personal sections with TKTK placeholders
- Created about page layout - about/layout.tsx with measure-wide container width matching template design and "about" tab highlighted in navigation
- Reordered navigation hierarchy on non-home pages - moved nav links above logo instead of below for better visual hierarchy and immediate navigation access

## 2024-12-21

- Created HTML template directory for rapid UI prototyping - added html-templates/ with 5 mockup pages using existing tachyons styling in html-templates branch
- Templates include homepage post list, individual post page, tags index, tag-filtered posts, and base layout structure - enables faster iteration on visual design before updating React components
- All templates use real content from current blog posts and maintain consistent styling with existing Next.js components - provides realistic preview environment for design changes
- Fixed CSS loading for HTML templates - copied assets/ directory to html-templates/ and updated paths to relative references so templates can be opened directly in browser with full styling
- Updated homepage logo to always display with random colors and typography - removed default white background/black text combination in favor of full randomization on every page load in home.html
- Added subtle hover shadow effect to homepage logo - included smooth box-shadow transition while keeping color changes instant for better interaction feedback
- Created projects and contact page mockups - added projects.html and contact.html with same navigation structure as studio log but standard content layout instead of special homepage treatment
- Made all navigation functional across HTML templates - updated all nav links to use relative paths (home.html, index.html, projects.html, contact.html) for easy local browsing during design work, updated internal "back to posts" links as well
- Created about page mockup - added about.html with background, current focus, site description, and philosophy sections, updated all navigation links across templates to point to about.html instead of /about
- Made navigation logo gray across all pages except homepage - updated Studio Queral logo in nav header from black to gray for better visual hierarchy, maintaining special treatment on home.html
- Enhanced navigation logo interactions - removed underlines, added near-black hover state (#111), and 1px downward nudge on click/focus for better tactile feedback across all navigation headers

## 2024-12-20

- cleaned git history to remove large video files and improve push performance - used git-filter-repo to strip all video files (*.mp4, *.mov, etc.), files >5MB, and build artifacts from entire repository history while preserving all 36 commits, reduced repo size from 800MB+ to 215MB for fast pushes, then further optimized by removing all asset files (images, fonts, etc.) since using CDN, final repo size: 368KB (99.8% reduction)
- flipped navigation and logo order back on non-homepage pages - logo now appears first (above) navigation links for better visual hierarchy and logo prominence across studio-log, projects, about, and individual post pages
- added profile image from HTML templates to about page by copying luis-web.jpg to public assets directory
- set up automated documentation system with Cursor integration - added system prompt to maintain running changelog of all code changes and architectural decisions
- current system includes Next.js frontend, Python parsers, and Vercel Blob asset management - baseline established for tracking future modifications
- **deployed studio log to production on vercel** - complete publishing workflow executed successfully: parsed 16 posts from obsidian, compressed 20 assets from 476MB to 47.4MB (90% reduction), fixed eslint errors, built production bundle, and deployed to https://studio-mn8e4689c-luismquerals-projects.vercel.app
- **enhanced logo character rotation system** - implemented elegant three-tier probability system: 40% no rotation (straight), 50% subtle rotation (±3°), 10% bold rotation (±8°), added configurable ROTATION_CONFIG for easy adjustments, fixed useCallback dependency warning, creates balanced aesthetic with personality while maintaining readability

---

*This changelog is automatically maintained through Cursor AI assistance. Each entry captures what changed, why it changed, and the functional impact on the system.*