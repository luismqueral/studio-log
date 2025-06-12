"""
Studio Log Parser
Splits long-form studio log files into individual posts by H1 headers
"""

import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import markdown
from config import DATE_FORMATS

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
        from config import BASE_URL
        return f"{BASE_URL.rstrip('/')}/{self.url_path}"

class StudioLogParser:
    """Parses studio log markdown files into individual posts"""
    
    def __init__(self):
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
    
    def parse_file(self, file_path: Path) -> List[Post]:
        """Parse a studio log file into individual posts"""
        if not file_path.exists():
            raise FileNotFoundError(f"Studio log file not found: {file_path}")
        
        content = file_path.read_text(encoding='utf-8')
        return self.parse_content(content, file_path)
    
    def parse_content(self, content: str, source_file: Path) -> List[Post]:
        """Parse content string into individual posts"""
        posts = []
        
        # Split by H1 headers (# at start of line)
        sections = re.split(r'\n(?=# )', content)
        
        # Skip the first section if it doesn't start with #
        if sections and not sections[0].strip().startswith('#'):
            sections = sections[1:]
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
                
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