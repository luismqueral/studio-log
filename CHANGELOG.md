# Studio Log Generator - Change Log

This document tracks all significant changes to the studio log system in plain English.

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

- Set up automated documentation system with Cursor integration - added system prompt to maintain running changelog of all code changes and architectural decisions
- Current system includes Next.js frontend, Python parsers, and Vercel Blob asset management - baseline established for tracking future modifications

---

*This changelog is automatically maintained through Cursor AI assistance. Each entry captures what changed, why it changed, and the functional impact on the system.*