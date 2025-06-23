# Studio Log Publishing System

*Auto-generated documentation - Last updated: 2025-06-23 00:09:49*

## Overview
Automated system for converting Obsidian studio log entries into a published Next.js blog with tag support and asset management.

## Quick Start
```bash
# Parse and publish
publish-blog

# Development
dev-blog

# Parse only  
parse-blog
```

## System Components

# System Architecture

*Generated on: 2025-06-23 00:09:49*

## Python Backend

### Core Files

#### blob_parser.py
Smart Vercel Blob parser that ONLY uploads assets referenced in markdown files.

**Classes:**
- `SmartBlobAssetManager`: ...
  - Methods: __init__, load_cache, save_cache, get_file_hash, scan_for_referenced_assets, upload_to_blob, get_content_type, process_content

**Functions:**
- `process_markdown_files()`: Process all markdown files and upload only referenced assets to Blob...


#### blob_parser_with_compression.py
Smart Vercel Blob parser with compression that ONLY uploads assets referenced in markdown files.

**Classes:**
- `CompressingBlobAssetManager`: ...
  - Methods: __init__, load_cache, save_cache, get_file_hash, compress_image, compress_video, compress_asset, scan_for_referenced_assets, upload_to_blob, get_content_type, process_content, cleanup

**Functions:**
- `process_markdown_files()`: Process all markdown files and upload compressed referenced assets to Blob...


#### parser.py
Studio Log Parser with Incremental Processing
Splits long-form studio log files into individual posts by H1 headers
Only copies assets that are actually referenced in the markdown content
Includes incremental processing and cleanup of deleted posts

**Classes:**
- `Post`: Represents a single studio log post...
  - Methods: url_path, permalink
- `IncrementalStudioLogParser`: Parses studio log markdown files into individual posts with incremental processing...
  - Methods: __init__, load_last_run_info, save_last_run_info, get_changed_files, cleanup_stale_posts, find_asset_references, extract_hashtags, remove_hashtags_from_content, cleanup_local_assets, copy_referenced_assets, parse_file, parse_content, _parse_section, _parse_title_and_date, _generate_slug

**Functions:**
- `main(force_full_parse)`: Main function to run the parser with incremental processing...


#### scripts/generate_cursor_prompt.py
Cursor System Prompt Generator
Creates comprehensive system prompts based on current project state

**Classes:**
- `CursorPromptGenerator`: ...
  - Methods: __init__, analyze_current_state, generate_system_prompt, save_prompt_to_file, generate_current_prompt

**Functions:**
- `main()`: ...


#### scripts/decision_record.py
Decision Record System
Track architectural decisions and their rationale

**Classes:**
- `DecisionRecord`: ...
  - Methods: __init__, load_index, save_index, create_decision, update_status, generate_summary

**Functions:**
- `create_interactive_decision()`: Interactive decision creation...
- `main()`: ...


#### scripts/auto_docs.py
Automated Documentation System
Analyzes codebase and generates/updates documentation automatically

**Classes:**
- `AutoDocumentationSystem`: ...
  - Methods: __init__, analyze_git_changes, analyze_python_files, analyze_nextjs_structure, generate_architecture_doc, generate_change_summary, update_main_readme, run_full_documentation_update

**Functions:**
- `main()`: ...


#### scripts/install_git_hooks.py
Install Git Hooks for Automated Documentation
Sets up post-commit hooks to automatically update documentation

**Functions:**
- `install_post_commit_hook()`: Install post-commit hook for automatic documentation updates...
- `install_pre_push_hook()`: Install pre-push hook to generate deployment documentation...
- `main()`: ...


#### node_modules/flatted/python/flatted.py
**Classes:**
- `_Known`: ...
  - Methods: __init__
- `_String`: ...
  - Methods: __init__

**Functions:**
- `_array_keys(value)`: ...
- `_object_keys(value)`: ...
- `_is_array(value)`: ...
- `_is_object(value)`: ...
- `_is_string(value)`: ...
- `_index(known, input, value)`: ...
- `_loop(keys, input, known, output)`: ...
- `_ref(key, value, input, known, output)`: ...
- `_relate(known, input, value)`: ...
- `_transform(known, input, value)`: ...
- `_wrap(value)`: ...
- `parse(value)`: ...
- `stringify(value)`: ...


## Next.js Frontend

### Components
- **PostList** (`src/components/PostList.tsx`)
- **Tags** (`src/components/Tags.tsx`)
- **MarkdownRenderer** (`src/components/MarkdownRenderer.tsx`)
- **CodeBlock** (`src/components/CodeBlock.tsx`)

### Pages/Routes
- **/** → `src/app/page.tsx`
- **/tags** → `src/app/tags/page.tsx`
- **/[slug]** → `src/app/[slug]/page.tsx`
- **/tags/[tag]** → `src/app/tags/[tag]/page.tsx`

### Utilities
- **parser** (`src/lib/parser.ts`)
- **posts** (`src/lib/posts.ts`)
- **config** (`src/lib/config.ts`)


## Key Features
- **Draft Management**: Use `#draft` tag to exclude posts from publishing
- **Automatic Tagging**: Hashtags extracted from content and displayed as pills
- **Asset Management**: Automatic upload to Vercel Blob with compression
- **Incremental Processing**: Only processes changed files for efficiency

## Documentation
- **Architecture**: [`docs/architecture/`](./docs/architecture/)
- **Changes**: [`docs/changes/`](./docs/changes/) 
- **API**: [`docs/api/`](./docs/api/)
- **Decisions**: [`docs/decisions/`](./docs/decisions/)

---
*This README is automatically maintained. Do not edit manually.*
