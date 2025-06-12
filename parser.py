"""
Studio Log Parser
Splits long-form studio log files into individual posts by H1 headers
Only copies assets that are actually referenced in the markdown content
"""

import re
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass
import markdown

# Configuration
DATE_FORMATS = [
    '%m-%d-%Y',
    '%m/%d/%Y', 
    '%Y-%m-%d',
    '%B %d, %Y',
    '%b %d, %Y'
]

@dataclass
class Post:
    """Represents a single studio log post"""
    title: str
    slug: str
    date: datetime
    content: str
    html_content: str
    source_file: Path
    has_title: bool = False  # True if there's a real title (not just date)
    
    @property
    def url_path(self) -> str:
        """Generate URL path for this post"""
        return f"{self.slug}/"
    
    @property 
    def permalink(self) -> str:
        """Full permalink URL"""
        BASE_URL = "https://luismqueral.github.io/studio-log"  # Update this to your actual URL
        return f"{BASE_URL.rstrip('/')}/{self.url_path}"

class StudioLogParser:
    """Parses studio log markdown files into individual posts"""
    
    def __init__(self, vault_path: Path, output_dir: Path):
        self.vault_path = Path(vault_path)
        self.output_dir = Path(output_dir)
        self.referenced_assets: Set[str] = set()
        
        self.markdown_processor = markdown.Markdown(
            extensions=[
                'markdown.extensions.tables',
                'markdown.extensions.fenced_code', 
                'markdown.extensions.codehilite',
                'markdown.extensions.footnotes',
                'markdown.extensions.attr_list',
                'markdown.extensions.def_list',
                'markdown.extensions.md_in_html'
            ]
        )
    
    def find_asset_references(self, content: str) -> Set[str]:
        """Find all asset references in markdown content"""
        assets = set()
        
        # Find markdown image references: ![alt](path)
        img_pattern = r'!\[.*?\]\(([^)]+)\)'
        for match in re.finditer(img_pattern, content):
            asset_path = match.group(1)
            if not asset_path.startswith(('http://', 'https://')):
                assets.add(asset_path)
        
        # Find HTML img tags: <img src="path">
        html_img_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
        for match in re.finditer(html_img_pattern, content):
            asset_path = match.group(1)
            if not asset_path.startswith(('http://', 'https://')):
                assets.add(asset_path)
        
        # Find video references: <video src="path">
        video_pattern = r'<video[^>]+src=["\']([^"\']+)["\']'
        for match in re.finditer(video_pattern, content):
            asset_path = match.group(1)
            if not asset_path.startswith(('http://', 'https://')):
                assets.add(asset_path)
        
        # Find audio references: <audio src="path">
        audio_pattern = r'<audio[^>]+src=["\']([^"\']+)["\']'
        for match in re.finditer(audio_pattern, content):
            asset_path = match.group(1)
            if not asset_path.startswith(('http://', 'https://')):
                assets.add(asset_path)
        
        # Find link references to files: [text](file.pdf)
        link_pattern = r'\[.*?\]\(([^)]+\.(pdf|doc|docx|zip|mp4|mov|avi|mp3|wav))\)'
        for match in re.finditer(link_pattern, content, re.IGNORECASE):
            asset_path = match.group(1)
            if not asset_path.startswith(('http://', 'https://')):
                assets.add(asset_path)
        
        return assets
    
    def copy_referenced_assets(self):
        """Copy only the assets that are referenced in markdown files"""
        print(f"Copying {len(self.referenced_assets)} referenced assets...")
        
        # Create public directory if it doesn't exist
        public_dir = self.output_dir / "public"
        public_dir.mkdir(exist_ok=True)
        
        copied_count = 0
        for asset_path in self.referenced_assets:
            # Clean up the asset path (remove leading ./ or ../)
            clean_path = asset_path.lstrip('./')
            
            # Try to find the asset in the vault
            source_paths = [
                self.vault_path / clean_path,
                self.vault_path / "assets" / clean_path,
                self.vault_path / "_assets" / clean_path,
                self.vault_path / Path(clean_path).name,  # Just the filename
            ]
            
            source_file = None
            for path in source_paths:
                if path.exists():
                    source_file = path
                    break
            
            if source_file:
                # Determine destination path
                dest_path = public_dir / clean_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                try:
                    shutil.copy2(source_file, dest_path)
                    copied_count += 1
                    print(f"  ✓ Copied: {clean_path}")
                except Exception as e:
                    print(f"  ✗ Failed to copy {clean_path}: {e}")
            else:
                print(f"  ✗ Asset not found: {asset_path}")
        
        print(f"Successfully copied {copied_count} assets")
    
    def parse_file(self, file_path: Path) -> List[Post]:
        """Parse a studio log file into individual posts"""
        if not file_path.exists():
            raise FileNotFoundError(f"Studio log file not found: {file_path}")
        
        content = file_path.read_text(encoding='utf-8')
        return self.parse_content(content, file_path)
    
    def parse_content(self, content: str, source_file: Path) -> List[Post]:
        """Parse content string into individual posts"""
        posts = []
        
        # Find all asset references in this content
        assets = self.find_asset_references(content)
        self.referenced_assets.update(assets)
        
        # Split by H1 headers (# at start of line)
        sections = re.split(r'\n(?=# )', content)
        
        # Skip the first section if it doesn't start with #
        if sections and not sections[0].strip().startswith('#'):
            sections = sections[1:]
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
                
            # Find assets in this section too
            section_assets = self.find_asset_references(section)
            self.referenced_assets.update(section_assets)
                
            post = self._parse_section(section, source_file)
            if post:
                posts.append(post)
        
        # Sort posts by date (newest first)
        posts.sort(key=lambda p: p.date, reverse=True)
        return posts
    
    def _parse_section(self, section: str, source_file: Path) -> Optional[Post]:
        """Parse a single section into a Post"""
        lines = section.split('\n')
        if not lines:
            return None
        
        # First line should be the H1 header
        header_line = lines[0].strip()
        if not header_line.startswith('# '):
            return None
        
        # Extract title from header (remove the '# ')
        raw_title = header_line[2:].strip()
        
        # Parse date and title
        date_obj, clean_title = self._parse_title_and_date(raw_title)
        if not date_obj:
            print(f"Warning: Could not parse date from '{raw_title}' in {source_file}")
            return None
        
        # Determine display title and whether it has a real title
        has_title = clean_title is not None
        display_title = clean_title if has_title else raw_title
        slug_title = clean_title if clean_title else raw_title
        
        # Generate slug
        slug = self._generate_slug(slug_title, date_obj)
        
        # Get content (everything after the header)
        content_lines = lines[1:]
        content = '\n'.join(content_lines).strip()
        
        # Convert to HTML
        html_content = self.markdown_processor.reset().convert(content)
        
        return Post(
            title=display_title,
            slug=slug,
            date=date_obj,
            content=content,
            html_content=html_content,
            source_file=source_file,
            has_title=has_title
        )
    
    def _parse_title_and_date(self, raw_title: str) -> Tuple[Optional[datetime], Optional[str]]:
        """
        Parse title and extract date. Handle formats like:
        - "6-11-2025"
        - "6-11-2025 — Title of Post"
        """
        # Split on em dash if present
        parts = raw_title.split(' — ', 1)
        date_part = parts[0].strip()
        title_part = parts[1].strip() if len(parts) > 1 else None
        
        # Try to parse the date
        date_obj = None
        for date_format in DATE_FORMATS:
            try:
                date_obj = datetime.strptime(date_part, date_format)
                break
            except ValueError:
                continue
        
        return date_obj, title_part
    
    def _generate_slug(self, title: str, date: datetime) -> str:
        """Generate URL slug from title and date"""
        # Use the raw H1 title as the slug base
        if title:
            # Clean title for URL
            slug = re.sub(r'[^\w\s-]', '', title.lower())
            slug = re.sub(r'[-\s]+', '-', slug)
            slug = slug.strip('-')
            if slug:
                return slug
        
        # Fallback to date if no clean title
        return f"{date.month}-{date.day}-{date.year}"

def main():
    """Main function to run the parser"""
    # Update these paths to match your setup
    vault_path = Path("../")  # Path to your Obsidian vault
    output_dir = Path(".")    # Current directory (studio-log-nextjs)
    
    # Find all markdown files in the vault that contain studio logs
    studio_log_files = []
    for md_file in vault_path.glob("**/*.md"):
        if "studio log" in md_file.name.lower() or "log" in md_file.name.lower():
            studio_log_files.append(md_file)
    
    if not studio_log_files:
        print("No studio log files found!")
        return
    
    parser = StudioLogParser(vault_path, output_dir)
    all_posts = []
    
    # Parse all studio log files
    for file_path in studio_log_files:
        print(f"Parsing: {file_path}")
        try:
            posts = parser.parse_file(file_path)
            all_posts.extend(posts)
            print(f"  Found {len(posts)} posts")
        except Exception as e:
            print(f"  Error parsing {file_path}: {e}")
    
    # Copy only referenced assets
    parser.copy_referenced_assets()
    
    # Create content directory and save posts
    content_dir = output_dir / "content"
    content_dir.mkdir(exist_ok=True)
    
    # Save posts as individual markdown files
    for post in all_posts:
        post_file = content_dir / f"{post.slug}.md"
        with open(post_file, 'w', encoding='utf-8') as f:
            f.write(f"---\n")
            f.write(f"title: {post.title}\n")
            f.write(f"date: {post.date.isoformat()}\n")
            f.write(f"slug: {post.slug}\n")
            f.write(f"has_title: {post.has_title}\n")
            f.write(f"---\n\n")
            f.write(post.content)
    
    print(f"\nProcessed {len(all_posts)} posts")
    print(f"Referenced {len(parser.referenced_assets)} unique assets")

if __name__ == "__main__":
    main() 