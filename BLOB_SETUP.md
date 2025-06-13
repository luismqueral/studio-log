# Vercel Blob Asset Management

This project uses Vercel Blob to store and serve assets (images, videos, etc.) instead of including them in the Git repository.

## Setup

### 1. Create Vercel Blob Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Blob**
3. Click **Create Store**
4. Name it: `studio-log-assets`
5. Copy the `BLOB_READ_WRITE_TOKEN`

### 2. Set Environment Variable

```bash
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### 3. Test Setup

```bash
npm run test-blob
```

### 4. Upload Assets

```bash
npm run upload-assets
```

## How It Works

1. **Asset Detection**: The script scans all markdown files for asset references (`_assets/...`)
2. **Upload to Blob**: Referenced assets are uploaded to Vercel Blob storage
3. **URL Replacement**: Local asset paths are replaced with Blob URLs
4. **Caching**: Uploaded assets are cached to avoid re-uploading unchanged files

## Scripts

- `npm run upload-assets` - Upload assets and update markdown files
- `npm run deploy` - Upload assets, build, and deploy to production
- `npm run deploy:preview` - Upload assets, build, and deploy preview

## Benefits

- **Fast Deployments**: No large assets in Git repository
- **Global CDN**: Assets served from Vercel's global edge network
- **Cost Effective**: $23/month for 1TB vs $100/month for Git LFS
- **Automatic Optimization**: Vercel handles image optimization
- **Integrated Billing**: Single bill with your Vercel hosting

## File Structure

```
studio-log-nextjs/
├── blob_parser.py      # Main asset upload script
├── test_blob.py        # Setup verification script
├── blob_cache.json     # Upload cache (auto-generated)
├── venv/              # Python virtual environment
└── content/           # Markdown files with updated URLs
```

## Cache Management

The `blob_cache.json` file tracks uploaded assets to avoid re-uploading:
- **Hash-based**: Only uploads when file content changes
- **Metadata**: Stores URL, size, and upload timestamp
- **Reset**: Delete cache file to force re-upload all assets 