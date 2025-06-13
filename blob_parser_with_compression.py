#!/usr/bin/env python3
"""
Smart Vercel Blob parser with compression that ONLY uploads assets referenced in markdown files.
"""

import os
import requests
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image

class CompressingBlobAssetManager:
    def __init__(self, blob_token):
        self.blob_token = blob_token
        self.cache_file = "blob_cache.json"
        self.cache = self.load_cache()
        self.upload_url = "https://blob.vercel-storage.com"
        self.temp_dir = Path(tempfile.mkdtemp(prefix="blob_assets_"))
        print(f"📁 Using temp directory: {self.temp_dir}")
    
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
    
    def compress_image(self, input_path, output_path):
        """Compress image using Pillow"""
        try:
            with Image.open(input_path) as img:
                # Convert RGBA to RGB if saving as JPEG
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Convert to RGB with white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                
                # Determine output format and quality
                original_size = os.path.getsize(input_path)
                
                # Try WebP first (best compression)
                webp_path = output_path.with_suffix('.webp')
                img.save(webp_path, 'WebP', quality=85, optimize=True)
                webp_size = os.path.getsize(webp_path)
                
                # Try JPEG (good compatibility)
                jpeg_path = output_path.with_suffix('.jpg')
                img.save(jpeg_path, 'JPEG', quality=85, optimize=True)
                jpeg_size = os.path.getsize(jpeg_path)
                
                # Choose the smaller file
                if webp_size < jpeg_size:
                    if jpeg_path.exists():
                        jpeg_path.unlink()
                    final_path = webp_path
                    final_size = webp_size
                else:
                    if webp_path.exists():
                        webp_path.unlink()
                    final_path = jpeg_path
                    final_size = jpeg_size
                
                compression_ratio = (1 - final_size / original_size) * 100
                print(f"    📷 Compressed image: {original_size/1024:.0f}KB → {final_size/1024:.0f}KB ({compression_ratio:.1f}% smaller)")
                
                return final_path
                
        except Exception as e:
            print(f"    ❌ Image compression failed: {str(e)}")
            # Copy original if compression fails
            import shutil
            shutil.copy2(input_path, output_path)
            return output_path
    
    def compress_video(self, input_path, output_path):
        """Compress video using ffmpeg"""
        try:
            # Check if ffmpeg is available
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
            
            original_size = os.path.getsize(input_path)
            
            # Compress video with good quality/size balance
            cmd = [
                'ffmpeg', '-i', str(input_path),
                '-c:v', 'libx264',  # H.264 codec
                '-crf', '28',       # Constant Rate Factor (lower = better quality)
                '-preset', 'medium', # Encoding speed vs compression
                '-c:a', 'aac',      # Audio codec
                '-b:a', '128k',     # Audio bitrate
                '-movflags', '+faststart',  # Web optimization
                '-y',               # Overwrite output
                str(output_path)
            ]
            
            print(f"    🎬 Compressing video with ffmpeg...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0 and output_path.exists():
                compressed_size = os.path.getsize(output_path)
                compression_ratio = (1 - compressed_size / original_size) * 100
                print(f"    📹 Compressed video: {original_size/1024/1024:.1f}MB → {compressed_size/1024/1024:.1f}MB ({compression_ratio:.1f}% smaller)")
                return output_path
            else:
                print(f"    ❌ Video compression failed: {result.stderr}")
                # Copy original if compression fails
                import shutil
                shutil.copy2(input_path, output_path)
                return output_path
                
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"    ⚠️  ffmpeg not available, using original video")
            # Copy original if ffmpeg not available
            import shutil
            shutil.copy2(input_path, output_path)
            return output_path
    
    def compress_asset(self, asset_path):
        """Compress asset based on type"""
        asset_path = Path(asset_path)
        ext = asset_path.suffix.lower()
        
        # Create compressed version in temp directory
        temp_output = self.temp_dir / asset_path.name
        
        if ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']:
            print(f"    🖼️  Compressing image: {asset_path.name}")
            return self.compress_image(asset_path, temp_output)
        elif ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']:
            print(f"    🎥 Compressing video: {asset_path.name}")
            return self.compress_video(asset_path, temp_output.with_suffix('.mp4'))
        else:
            print(f"    📄 Copying file as-is: {asset_path.name}")
            # Copy other files without compression
            import shutil
            shutil.copy2(asset_path, temp_output)
            return temp_output
    
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
    
    def process_content(self, content, source_dir, referenced_assets, asset_url_mapping):
        """Process markdown content and replace with Blob URLs"""
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
                clean_asset_name = None
                
                if asset_path.startswith('_assets/'):
                    clean_asset_name = asset_path[8:]
                elif asset_path.startswith('../_assets/'):
                    clean_asset_name = asset_path[11:]
                
                # Only process if this asset is in our referenced list and has a URL mapping
                if clean_asset_name and clean_asset_name in referenced_assets and clean_asset_name in asset_url_mapping:
                    blob_url = asset_url_mapping[clean_asset_name]
                    
                    # Replace in content
                    if pattern_type == 'markdown_image':
                        new_ref = f"![{alt_text}]({blob_url})"
                    else:
                        new_ref = full_match.replace(asset_path, blob_url)
                    
                    content = content.replace(full_match, new_ref)
                    changes_made = True
                    print(f"🔄 Replaced {asset_path} with {blob_url}")
        
        return content, changes_made
    
    def cleanup(self):
        """Clean up temporary directory"""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up temp directory: {self.temp_dir}")

def process_markdown_files():
    """Process all markdown files and upload compressed referenced assets to Blob"""
    blob_token = os.getenv('BLOB_READ_WRITE_TOKEN')
    if not blob_token:
        print("❌ BLOB_READ_WRITE_TOKEN environment variable not set")
        print("   Please set it with your Vercel Blob token:")
        print("   export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx")
        return False
    
    asset_manager = CompressingBlobAssetManager(blob_token)
    
    try:
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
        
        # Calculate original sizes and compress assets
        assets_dir = Path("../_assets")
        total_original_size = 0
        total_compressed_size = 0
        asset_url_mapping = {}
        
        print(f"\n🗜️  Compressing and uploading {len(referenced_assets)} assets...")
        
        for asset_name in referenced_assets:
            asset_path = assets_dir / asset_name
            if asset_path.exists():
                original_size = asset_path.stat().st_size
                total_original_size += original_size
                
                print(f"\n📦 Processing: {asset_name} ({original_size/1024/1024:.1f}MB)")
                
                # Compress asset
                compressed_path = asset_manager.compress_asset(asset_path)
                compressed_size = compressed_path.stat().st_size
                total_compressed_size += compressed_size
                
                # Upload compressed version
                blob_url = asset_manager.upload_to_blob(compressed_path, compressed_path.name)
                if blob_url:
                    asset_url_mapping[asset_name] = blob_url
            else:
                print(f"⚠️  Referenced asset not found: {asset_path}")
        
        # Show compression stats
        if total_original_size > 0:
            compression_ratio = (1 - total_compressed_size / total_original_size) * 100
            print(f"\n📊 COMPRESSION SUMMARY:")
            print(f"   Original size: {total_original_size/1024/1024:.1f}MB")
            print(f"   Compressed size: {total_compressed_size/1024/1024:.1f}MB")
            print(f"   Space saved: {compression_ratio:.1f}%")
        
        # Now update markdown files with Blob URLs
        print(f"\n📝 Updating markdown files with Blob URLs...")
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
                    referenced_assets,
                    asset_url_mapping
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
        print(f"   Assets uploaded: {len(asset_url_mapping)}")
        
        return True
        
    finally:
        # Always clean up
        asset_manager.cleanup()

if __name__ == "__main__":
    print("🚀 Starting smart Vercel Blob asset processing with compression...")
    print("   (Only uploading compressed assets referenced in markdown files)")
    success = process_markdown_files()
    if success:
        print("✅ All done! Compressed referenced assets are now stored in Vercel Blob.")
    else:
        print("❌ Processing failed. Please check the errors above.") 