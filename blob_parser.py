#!/usr/bin/env python3
"""
Smart Vercel Blob parser that ONLY uploads assets referenced in markdown files.
"""

import os
import requests
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse

class SmartBlobAssetManager:
    def __init__(self, blob_token):
        self.blob_token = blob_token
        self.cache_file = "blob_cache.json"
        self.cache = self.load_cache()
        self.upload_url = "https://blob.vercel-storage.com"
        self.referenced_assets = set()
    
    def load_cache(self):
        """Load asset cache to avoid re-uploading unchanged files"""
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def save_cache(self):
        """Save asset cache"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
    
    def get_file_hash(self, file_path):
        """Get MD5 hash of file for change detection"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def scan_for_referenced_assets(self, content_dir):
        """Scan all markdown files to find which assets are actually referenced"""
        print("🔍 Scanning markdown files for asset references...")
        
        referenced_assets = set()
        
        # Patterns to find asset references
        patterns = [
            r'!\[([^\]]*)\]\(([^)]+)\)',  # ![alt](path)
            r'<img[^>]+src="([^"]+)"[^>]*>',   # <img src="path">
            r'<video[^>]+src="([^"]+)"[^>]*>', # <video src="path">
        ]
        
        for md_file in content_dir.glob("*.md"):
            print(f"  📄 Scanning {md_file.name}...")
            
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                for pattern in patterns:
                    matches = re.finditer(pattern, content)
                    for match in matches:
                        if pattern.startswith(r'!\['):
                            # Markdown image: ![alt](path)
                            asset_path = match.group(2)
                        else:
                            # HTML img/video: src="path"
                            asset_path = match.group(1)
                        
                        # Only process _assets references
                        if '_assets' in asset_path:
                            # Normalize the path
                            if asset_path.startswith('_assets/'):
                                clean_path = asset_path[8:]  # Remove '_assets/'
                            elif asset_path.startswith('../_assets/'):
                                clean_path = asset_path[11:]  # Remove '../_assets/'
                            else:
                                continue
                            
                            referenced_assets.add(clean_path)
                            print(f"    🔗 Found reference: {clean_path}")
            
            except Exception as e:
                print(f"    ❌ Error scanning {md_file.name}: {str(e)}")
        
        print(f"\n📊 Found {len(referenced_assets)} unique asset references")
        for asset in sorted(referenced_assets):
            print(f"  • {asset}")
        
        return referenced_assets
    
    def upload_to_blob(self, file_path, filename=None):
        """Upload file to Vercel Blob"""
        if filename is None:
            filename = os.path.basename(file_path)
        
        # Check cache first
        file_hash = self.get_file_hash(file_path)
        cache_key = f"{filename}_{file_hash}"
        
        if cache_key in self.cache:
            print(f"📋 Using cached URL for {filename}")
            return self.cache[cache_key]['url']
        
        # Prepare file for upload
        file_size = os.path.getsize(file_path)
        print(f"📤 Uploading {filename} ({file_size / 1024 / 1024:.1f}MB) to Blob...")
        
        try:
            # Upload to Blob using the REST API
            headers = {
                'Authorization': f'Bearer {self.blob_token}',
                'X-Content-Type': self.get_content_type(filename),
            }
            
            with open(file_path, 'rb') as f:
                response = requests.put(
                    f"{self.upload_url}/{filename}",
                    headers=headers,
                    data=f
                )
            
            if response.status_code in [200, 201]:
                result = response.json()
                blob_url = result.get('url', f"{self.upload_url}/{filename}")
                
                # Cache the result
                self.cache[cache_key] = {
                    'url': blob_url,
                    'filename': filename,
                    'hash': file_hash,
                    'size': file_size,
                    'uploaded_at': str(Path(file_path).stat().st_mtime)
                }
                self.save_cache()
                
                print(f"✅ Uploaded {filename} to Blob: {blob_url}")
                return blob_url
            else:
                print(f"❌ Failed to upload {filename}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error uploading {filename}: {str(e)}")
            return None
    
    def get_content_type(self, filename):
        """Get content type based on file extension"""
        ext = Path(filename).suffix.lower()
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.webm': 'video/webm',
            '.pdf': 'application/pdf',
        }
        return content_types.get(ext, 'application/octet-stream')
    
    def process_content(self, content, source_dir, referenced_assets):
        """Process markdown content and upload only referenced assets"""
        # Find all asset references
        patterns = [
            (r'!\[([^\]]*)\]\(([^)]+)\)', 'markdown_image'),  # ![alt](path)
            (r'<img[^>]+src="([^"]+)"[^>]*>', 'html_image'),   # <img src="path">
            (r'<video[^>]+src="([^"]+)"[^>]*>', 'html_video'), # <video src="path">
        ]
        
        changes_made = False
        
        for pattern, pattern_type in patterns:
            matches = list(re.finditer(pattern, content))
            
            for match in matches:
                if pattern_type == 'markdown_image':
                    alt_text, asset_path = match.groups()
                    full_match = match.group(0)
                elif pattern_type in ['html_image', 'html_video']:
                    asset_path = match.group(1)
                    full_match = match.group(0)
                else:
                    continue
                
                # Skip if already a URL
                if asset_path.startswith(('http://', 'https://', 'blob:')):
                    continue
                
                # Handle _assets paths
                local_path = None
                clean_asset_name = None
                
                if asset_path.startswith('_assets/'):
                    clean_asset_name = asset_path[8:]
                    local_path = os.path.join(source_dir, '..', '..', '_assets', clean_asset_name)
                elif asset_path.startswith('../_assets/'):
                    clean_asset_name = asset_path[11:]
                    local_path = os.path.join(source_dir, '..', '..', '_assets', clean_asset_name)
                
                # Only process if this asset is in our referenced list
                if clean_asset_name and clean_asset_name in referenced_assets:
                    local_path = os.path.normpath(local_path)
                    
                    if os.path.exists(local_path):
                        # Upload to Blob
                        blob_url = self.upload_to_blob(local_path)
                        if blob_url:
                            # Replace in content
                            if pattern_type == 'markdown_image':
                                new_ref = f"![{alt_text}]({blob_url})"
                            else:
                                new_ref = full_match.replace(asset_path, blob_url)
                            
                            content = content.replace(full_match, new_ref)
                            changes_made = True
                            print(f"🔄 Replaced {asset_path} with {blob_url}")
                    else:
                        print(f"⚠️  Referenced asset not found: {local_path}")
        
        return content, changes_made

def process_markdown_files():
    """Process all markdown files and upload only referenced assets to Blob"""
    blob_token = os.getenv('BLOB_READ_WRITE_TOKEN')
    if not blob_token:
        print("❌ BLOB_READ_WRITE_TOKEN environment variable not set")
        print("   Please set it with your Vercel Blob token:")
        print("   export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx")
        return False
    
    asset_manager = SmartBlobAssetManager(blob_token)
    
    # Process all markdown files
    content_dir = Path("content")
    if not content_dir.exists():
        print(f"❌ Content directory not found: {content_dir}")
        return False
    
    # First, scan all files to find referenced assets
    referenced_assets = asset_manager.scan_for_referenced_assets(content_dir)
    
    if not referenced_assets:
        print("📋 No asset references found in markdown files")
        return True
    
    # Calculate total size of referenced assets
    assets_dir = Path("../_assets")
    total_size = 0
    found_assets = 0
    
    for asset_name in referenced_assets:
        asset_path = assets_dir / asset_name
        if asset_path.exists():
            total_size += asset_path.stat().st_size
            found_assets += 1
    
    print(f"\n📦 Will upload {found_assets}/{len(referenced_assets)} referenced assets")
    print(f"📊 Total size: {total_size / 1024 / 1024:.1f}MB")
    
    # Now process files and upload assets
    processed_files = 0
    updated_files = 0
    
    for md_file in content_dir.glob("*.md"):
        print(f"\n📄 Processing {md_file.name}...")
        
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Process assets
            updated_content, changes_made = asset_manager.process_content(
                content, 
                str(md_file.parent),
                referenced_assets
            )
            
            # Write back if changed
            if changes_made:
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                print(f"✅ Updated {md_file.name} with Blob URLs")
                updated_files += 1
            else:
                print(f"📋 No changes needed for {md_file.name}")
            
            processed_files += 1
            
        except Exception as e:
            print(f"❌ Error processing {md_file.name}: {str(e)}")
    
    print(f"\n🎉 Processing complete!")
    print(f"   Files processed: {processed_files}")
    print(f"   Files updated: {updated_files}")
    print(f"   Assets uploaded: {found_assets}")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting smart Vercel Blob asset processing...")
    print("   (Only uploading assets referenced in markdown files)")
    success = process_markdown_files()
    if success:
        print("✅ All done! Only referenced assets are now stored in Vercel Blob.")
    else:
        print("❌ Processing failed. Please check the errors above.") 