"""
Studio Log Parser with Incremental Processing
Splits long-form studio log files into individual posts by H1 headers
Only copies assets that are actually referenced in the markdown content
Includes incremental processing and cleanup of deleted posts
"""

import re
import os
import shutil
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, field
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
    tags: List[str] = field(default_factory=list)  # Extracted hashtags from content
    
    @property
    def url_path(self) -> str:
        """Generate URL path for this post"""
        return f"{self.slug}/"
    
    @property 
    def permalink(self) -> str:
        """Full permalink URL"""
        BASE_URL = "https://luismqueral.github.io/studio-log"  # Update this to your actual URL
        return f"{BASE_URL.rstrip('/')}/{self.url_path}"

class IncrementalStudioLogParser:
    """Parses studio log markdown files into individual posts with incremental processing"""
    
    def __init__(self, vault_path: Path, output_dir: Path, force_full_parse: bool = False):
        self.vault_path = Path(vault_path)
        self.output_dir = Path(output_dir)
        self.referenced_assets: Set[str] = set()
        self.force_full_parse = force_full_parse
        self.last_run_file = self.output_dir / ".last_parse_run.json"
        self.current_run_posts: Set[str] = set()  # Track posts generated in this run
        
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
    
    def load_last_run_info(self) -> Dict:
        """Load information about the last parser run"""
        if not self.last_run_file.exists():
            return {"last_run_time": 0, "processed_files": {}}
        
        try:
            with open(self.last_run_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            print("Warning: Could not read last run file, performing full parse")
            return {"last_run_time": 0, "processed_files": {}}
    
    def save_last_run_info(self, processed_files: Dict[str, float]):
        """Save information about this parser run"""
        run_info = {
            "last_run_time": datetime.now().timestamp(),
            "processed_files": processed_files,
            "generated_posts": list(self.current_run_posts)
        }
        
        with open(self.last_run_file, 'w') as f:
            json.dump(run_info, f, indent=2)
    
    def get_changed_files(self, studio_log_files: List[Path]) -> Tuple[List[Path], Dict[str, float]]:
        """Get list of files that have changed since last run"""
        if self.force_full_parse:
            print("🔄 Force full parse requested")
            return studio_log_files, {}
        
        last_run_info = self.load_last_run_info()
        last_run_time = last_run_info.get("last_run_time", 0)
        processed_files = last_run_info.get("processed_files", {})
        
        if last_run_time == 0:
            print("📁 No previous run found, performing full parse")
            return studio_log_files, {}
        
        changed_files = []
        current_file_times = {}
        
        for file_path in studio_log_files:
            file_key = str(file_path)
            file_mtime = file_path.stat().st_mtime
            current_file_times[file_key] = file_mtime
            
            # Check if file is new or modified
            if (file_key not in processed_files or 
                file_mtime > processed_files[file_key]):
                changed_files.append(file_path)
                print(f"📝 Changed: {file_path.name}")
            else:
                print(f"📋 Unchanged: {file_path.name}")
        
        if not changed_files:
            print("✅ No files have changed since last run")
        else:
            print(f"🔄 Found {len(changed_files)} changed files out of {len(studio_log_files)} total")
        
        return changed_files, current_file_times
    
    def cleanup_stale_posts(self):
        """Remove posts that are no longer referenced in source files"""
        content_dir = self.output_dir / "content"
        if not content_dir.exists():
            return
        
        # Get all existing post files
        existing_posts = set()
        for post_file in content_dir.glob("*.md"):
            existing_posts.add(post_file.stem)  # filename without extension
        
        # Find posts that were not generated in this run
        stale_posts = existing_posts - self.current_run_posts
        
        if stale_posts:
            print(f"🧹 Cleaning up {len(stale_posts)} stale posts:")
            for stale_post in stale_posts:
                stale_file = content_dir / f"{stale_post}.md"
                try:
                    stale_file.unlink()
                    print(f"  🗑️  Removed: {stale_post}.md")
                except Exception as e:
                    print(f"  ❌ Failed to remove {stale_post}.md: {e}")
        else:
            print("✅ No stale posts to clean up")
    
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
    
    def extract_hashtags(self, content: str) -> List[str]:
        """Extract hashtags (#tag) from content"""
        # Pattern to match hashtags: #word 
        # Exclude markdown headers (# at start of line followed by space)
        hashtag_pattern = r'(?<!^#\s)(?<!\s#\s)#([a-zA-Z][a-zA-Z0-9_-]*)'
        
        hashtags = []
        lines = content.split('\n')
        
        for line in lines:
            # Skip lines that are markdown headers (start with # followed by space)
            if line.strip().startswith('# '):
                continue
                
            # Find hashtags in this line
            for match in re.finditer(hashtag_pattern, line):
                tag = match.group(1).lower()
                if tag not in hashtags:  # Avoid duplicates
                    hashtags.append(tag)
        
        return hashtags
    
    def remove_hashtags_from_content(self, content: str) -> str:
        """Remove hashtags from content after they've been extracted"""
        # Pattern to match hashtags: #word
        # Exclude markdown headers (# at start of line followed by space)
        hashtag_pattern = r'(?<!^#\s)(?<!\s#\s)#[a-zA-Z][a-zA-Z0-9_-]*'
        
        lines = content.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Skip cleaning lines that are markdown headers
            if line.strip().startswith('# '):
                cleaned_lines.append(line)
                continue
            
            # Remove hashtags from this line
            cleaned_line = re.sub(hashtag_pattern, '', line)
            
            # Clean up any extra whitespace left behind
            cleaned_line = re.sub(r'\s+', ' ', cleaned_line).strip()
            
            # Only add non-empty lines or lines that had other content
            if cleaned_line or line.strip() == '':
                cleaned_lines.append(cleaned_line)
        
        return '\n'.join(cleaned_lines)
    
    def cleanup_local_assets(self):
        """Remove locally copied assets since we're using Vercel Blob"""
        public_assets_dir = self.output_dir / "public" / "_assets"
        if public_assets_dir.exists():
            try:
                shutil.rmtree(public_assets_dir)
                print("🧹 Cleaned up local assets directory (using Vercel Blob instead)")
            except Exception as e:
                print(f"⚠️  Could not clean up local assets: {e}")

    def copy_referenced_assets(self):
        """Track referenced assets for Vercel Blob upload (skip local copying)"""
        if not self.referenced_assets:
            print("📋 No assets referenced")
            return
            
        print(f"📎 Tracked {len(self.referenced_assets)} referenced assets for Vercel Blob upload")
        
        # Log the assets that will be uploaded by the blob parser
        for asset_path in self.referenced_assets:
            clean_path = asset_path.lstrip('./')
            print(f"  📎 {clean_path}")
        
        print("📋 Assets will be uploaded to Vercel Blob and URLs updated in markdown")
        
        # Clean up any existing local assets
        self.cleanup_local_assets()
    
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
                # Track this post as generated in current run (only if not draft)
                if 'draft' not in post.tags:
                    self.current_run_posts.add(post.slug)
        
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
            print(f"⚠️  Warning: Could not parse date from '{raw_title}' in {source_file}")
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
        
        # Extract hashtags from content
        tags = self.extract_hashtags(content)
        
        # Remove hashtags from content after extraction
        cleaned_content = self.remove_hashtags_from_content(content)
        
        # Convert to HTML
        html_content = self.markdown_processor.reset().convert(cleaned_content)
        
        return Post(
            title=display_title,
            slug=slug,
            date=date_obj,
            content=cleaned_content,
            html_content=html_content,
            source_file=source_file,
            has_title=has_title,
            tags=tags
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

def main(force_full_parse: bool = False):
    """Main function to run the parser with incremental processing"""
    print("🚀 Starting Studio Log Parser with Incremental Processing")
    
    # Update these paths to match your setup
    vault_path = Path("../")  # Path to your Obsidian vault
    output_dir = Path(".")    # Current directory (studio-log-nextjs)
    
    # Find studio log files using two approaches:
    # 1. Files in journals/studio log/ directory (preferred)
    # 2. Files with "studio log" (not just "log") in the filename
    
    exclude_dirs = {'node_modules', '.git', '.next', 'venv', '__pycache__', 'content', 'public'}
    
    studio_log_files = []
    
    # Approach 1: Look in dedicated studio log directory
    studio_log_dir = vault_path / "journals" / "studio log"
    if studio_log_dir.exists():
        for md_file in studio_log_dir.glob("*.md"):
            studio_log_files.append(md_file)
            print(f"📁 Found studio log: {md_file.relative_to(vault_path)}")
    
    # Approach 2: Look for files with "studio log" in filename (not just "log")  
    for md_file in vault_path.glob("**/*.md"):
        # Skip files in excluded directories (including generated content)
        if any(part in exclude_dirs for part in md_file.parts):
            continue
        # Only include files with "studio log" specifically in the name
        if "studio log" in md_file.name.lower():
            # Avoid duplicates from approach 1
            if md_file not in studio_log_files:
                studio_log_files.append(md_file)
                print(f"📝 Found studio log: {md_file.relative_to(vault_path)}")
    
    if not studio_log_files:
        print("❌ No studio log files found!")
        return
    
    print(f"📁 Found {len(studio_log_files)} studio log files")
    
    parser = IncrementalStudioLogParser(vault_path, output_dir, force_full_parse)
    
    # Get files that have changed since last run
    changed_files, current_file_times = parser.get_changed_files(studio_log_files)
    
    if not changed_files and not force_full_parse:
        print("✅ No changes detected. Use --force to force full parse.")
        return
    
    all_posts = []
    
    # Parse changed files
    for file_path in changed_files:
        print(f"📝 Parsing: {file_path.name}")
        try:
            posts = parser.parse_file(file_path)
            all_posts.extend(posts)
            print(f"  ✅ Found {len(posts)} posts")
        except Exception as e:
            print(f"  ❌ Error parsing {file_path}: {e}")
    
    # If we're not doing a full parse, we need to load existing posts from unchanged files
    # to maintain the complete set for navigation and cleanup
    if not force_full_parse and len(changed_files) < len(studio_log_files):
        print("📋 Loading existing posts from unchanged files for complete index...")
        content_dir = output_dir / "content"
        if content_dir.exists():
            for post_file in content_dir.glob("*.md"):
                parser.current_run_posts.add(post_file.stem)
    
    # Track referenced assets for Vercel Blob upload
    parser.copy_referenced_assets()
    
    # Filter out draft posts (posts with 'draft' tag)
    publishable_posts = [post for post in all_posts if 'draft' not in post.tags]
    draft_posts = [post for post in all_posts if 'draft' in post.tags]
    
    # Create content directory and save posts
    content_dir = output_dir / "content"
    content_dir.mkdir(exist_ok=True)
    
    if draft_posts:
        print(f"📝 Skipping {len(draft_posts)} draft posts (not publishing):")
        for draft_post in draft_posts:
            print(f"  📋 {draft_post.title} (tags: {', '.join(draft_post.tags)})")
    
    # Save publishable posts as individual markdown files
    for post in publishable_posts:
        post_file = content_dir / f"{post.slug}.md"
        with open(post_file, 'w', encoding='utf-8') as f:
            f.write(f"---\n")
            f.write(f"title: {post.title}\n")
            f.write(f"date: {post.date.isoformat()}\n")
            f.write(f"slug: {post.slug}\n")
            f.write(f"has_title: {post.has_title}\n")
            if post.tags:
                # Write tags as YAML array
                f.write(f"tags: {json.dumps(post.tags)}\n")
            f.write(f"---\n\n")
            f.write(post.content)
    
    # Clean up stale posts (only if we processed some files)
    if changed_files:
        parser.cleanup_stale_posts()
    
    # Save run information
    parser.save_last_run_info(current_file_times)
    
    print(f"\n🎉 Processing complete!")
    print(f"   📝 Processed {len(changed_files)} changed files")
    print(f"   📄 Found {len(all_posts)} total posts")
    print(f"   📋 Published {len(publishable_posts)} posts")
    if draft_posts:
        print(f"   📝 Skipped {len(draft_posts)} draft posts")
    print(f"   📎 Referenced {len(parser.referenced_assets)} unique assets")
    print(f"   🗂️  Tracked {len(parser.current_run_posts)} published posts")

if __name__ == "__main__":
    import sys
    force_full = "--force" in sys.argv or "-f" in sys.argv
    main(force_full_parse=force_full) 