# HTML Templates for Studio Log

This directory contains HTML mockups of the Studio Log blog using tachyons styling. These templates are designed for rapid prototyping and visual iteration before translating changes back to React components.

## Templates

### `base-layout.html`
Base layout template showing the common header structure and CSS imports. Use as reference for the overall page structure.

### `index.html` 
Homepage template showing a list of recent posts. Includes:
- Site header with title and description
- Multiple post entries with dates, titles (when present), content excerpts
- Tag pills with hover effects
- Post separators
- Sample content from actual blog posts

### `post.html`
Individual post page template. Features:
- Post header with date and title
- Full post content with proper typography
- Tag display
- Navigation footer with previous/next post links
- Uses `measure` class for optimal reading width

### `tags-index.html`
Tags overview page showing all available tags. Includes:
- Back navigation to main posts
- Tag count summary
- Tag cloud layout with pill-style tags
- Post counts for each tag
- Hover effects on tag items

### `tag-posts.html`
Tag-specific posts page showing filtered content. Features:
- Back navigation
- Prominent tag badge
- Filtered post list (reuses post list styling)
- Post count for the specific tag

## Styling Notes

- All templates use tachyons CSS classes for styling
- CSS files are included in the `assets/css/` directory within this template folder
- Custom CSS is loaded from `assets/css/custom.css` for post content styling
- Tag pills use consistent hover effects: `hover-bg-light-blue hover-white`
- Images use border styling: `ba b--light-gray bw2 br2`
- Post separators use: `bb b--light-gray mv4`
- Main container: `mw7 center pa4`
- Typography scale follows tachyons conventions (f1-f6)

## Usage

These templates can be opened directly in a browser to preview styling. When making changes:

1. Edit the HTML templates as needed
2. Test styling in the browser
3. Translate approved changes back to React components
4. Update the actual Next.js app components

## Sample Content

Templates include real content from the studio log for realistic preview, including:
- "Fighting Windmills" post about Obsidian setup
- Daily journal entries with images
- Various tag examples (#obsidian, #generative-art, #creative-tools, etc.) 