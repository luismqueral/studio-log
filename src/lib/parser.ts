import fs from 'fs'
import path from 'path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { parse } from 'date-fns'
import { Post } from '@/types/post'
import { siteConfig } from './config'

export class StudioLogParser {
  private processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)

  async parseFile(filePath: string): Promise<Post[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Studio log file not found: ${filePath}`)
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Check if this is a single file with frontmatter
    if (content.trim().startsWith('---')) {
      return this.parseFrontmatterFile(content, filePath)
    }
    
    // Otherwise parse as multi-post content
    return this.parseContent(content, filePath)
  }

  async parseFrontmatterFile(content: string, sourceFile: string): Promise<Post[]> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!frontmatterMatch) {
      console.warn(`Warning: Could not parse frontmatter in ${sourceFile}`)
      return []
    }

    const [, frontmatterText, bodyContent] = frontmatterMatch
    
    // Parse frontmatter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frontmatter: any = {}
    frontmatterText.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim()
        frontmatter[key.trim()] = value
      }
    })

    // Parse date
    let date: Date
    if (frontmatter.date) {
      date = new Date(frontmatter.date)
    } else {
      // Try to parse from title
      const { date: parsedDate } = this.parseTitleAndDate(frontmatter.title || '')
      date = parsedDate || new Date()
    }

    // Process content
    let processedContent = bodyContent.trim()
    processedContent = this.processImagePaths(processedContent, path.dirname(sourceFile))
    
    // Convert to HTML
    const htmlContent = await this.processor.process(processedContent)

    const post: Post = {
      title: frontmatter.title || 'Untitled',
      slug: frontmatter.slug || this.generateSlug(frontmatter.title || '', date),
      date,
      content: processedContent,
      htmlContent: String(htmlContent),
      sourceFile,
      hasTitle: frontmatter.has_title !== 'False',
      urlPath: `${frontmatter.slug || this.generateSlug(frontmatter.title || '', date)}/`,
      permalink: `${siteConfig.baseUrl.replace(/\/$/, '')}/${frontmatter.slug || this.generateSlug(frontmatter.title || '', date)}/`
    }

    return [post]
  }

  async parseContent(content: string, sourceFile: string): Promise<Post[]> {
    const posts: Post[] = []
    
    // Split by H1 headers (# at start of line)
    const sections = content.split(/\n(?=# )/)
    
    // Skip the first section if it doesn't start with #
    const validSections = sections[0].trim().startsWith('#') ? sections : sections.slice(1)
    
    for (const section of validSections) {
      const trimmedSection = section.trim()
      if (!trimmedSection) continue
      
      const post = await this.parseSection(trimmedSection, sourceFile)
      if (post) {
        posts.push(post)
      }
    }
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => b.date.getTime() - a.date.getTime())
    return posts
  }

  private async parseSection(section: string, sourceFile: string): Promise<Post | null> {
    const lines = section.split('\n')
    if (!lines.length) return null
    
    // First line should be the H1 header  
    const headerLine = lines[0].trim()
    if (!headerLine.startsWith('# ')) return null
    
    // Extract title from header (remove the '# ')
    const rawTitle = headerLine.slice(2).trim()
    
    // Parse date and title
    const { date, cleanTitle } = this.parseTitleAndDate(rawTitle)
    if (!date) {
      console.warn(`Warning: Could not parse date from '${rawTitle}' in ${sourceFile}`)
      return null
    }
    
    // Determine display title and whether it has a real title
    const hasTitle = cleanTitle !== null
    const displayTitle = cleanTitle || rawTitle
    const slugTitle = cleanTitle || rawTitle
    
    // Generate slug
    const slug = this.generateSlug(slugTitle, date)
    
    // Get content (everything after the header)
    const contentLines = lines.slice(1)
    let content = contentLines.join('\n').trim()
    
    // Process image paths before converting to HTML
    content = this.processImagePaths(content, path.dirname(sourceFile))
    
    // Convert to HTML
    const htmlContent = await this.processor.process(content)
    
    return {
      title: displayTitle,
      slug,
      date,
      content,
      htmlContent: String(htmlContent),
      sourceFile,
      hasTitle,
      urlPath: `${slug}/`,
      permalink: `${siteConfig.baseUrl.replace(/\/$/, '')}/${slug}/`
    }
  }

  private parseTitleAndDate(rawTitle: string): { date: Date | null; cleanTitle: string | null } {
    // Split on em dash if present
    const parts = rawTitle.split(' — ')
    const datePart = parts[0].trim()
    const titlePart = parts.length > 1 ? parts[1].trim() : null
    
    // Try to parse the date
    let date: Date | null = null
    for (const dateFormat of siteConfig.dateFormats) {
      try {
        date = parse(datePart, dateFormat, new Date())
        break
      } catch {
        continue
      }
    }
    
    return { date, cleanTitle: titlePart }
  }

  private processImagePaths(content: string, sourceDir: string): string {
    const assetDir = path.resolve(sourceDir, '..', '..', '_assets')
    const publicDir = path.resolve(process.cwd(), 'public', 'assets')

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const processAndCopyAsset = (assetFilename: string): string => {
      const sourcePath = path.join(assetDir, assetFilename)
      
      // Determine asset type and target directory
      const ext = path.extname(assetFilename).toLowerCase()
      let subDir = ''
      
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
        subDir = 'images'
      } else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
        subDir = 'videos'
      } else if (['.pdf', '.doc', '.docx'].includes(ext)) {
        subDir = 'documents'
      } else {
        // Default to images for unknown types
        subDir = 'images'
      }
      
      const targetDir = path.join(publicDir, subDir)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      
      const destPath = path.join(targetDir, assetFilename)

      if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath)
        console.log(`Copied asset: ${assetFilename} to ${subDir}/`)
      } else if (!fs.existsSync(sourcePath)) {
        console.warn(`  WARNING: Source asset not found: ${sourcePath}`)
      }
      return `/assets/${subDir}/${assetFilename}`
    }

    // Regex for HTML: src="_assets/..." or src="../_assets/..."
    content = content.replace(/<(img|video)([^>]*?)src="(?:\.\.\/)?_assets\/([^"\)\s]+)"([^>]*?)>/gi,
      (match, tag, pre, assetFilename, post) => {
        const newPath = processAndCopyAsset(assetFilename)
        return `<${tag}${pre}src="${newPath}"${post}>`
      }
    )

    // Regex for Markdown: ![](_assets/...) or ![](../_assets/...)
    content = content.replace(/!\[([^\]]*)\]\((?:\.\.\/)?_assets\/([^"\)\s]+)\)/g,
      (match, alt, assetFilename) => {
        const newPath = processAndCopyAsset(assetFilename)
        return `![${alt}](${newPath})`
      }
    )
    
    return content
  }

  private generateSlug(title: string, date: Date): string {
    if (title) {
      // Clean title for URL
      let slug = title.toLowerCase()
      slug = slug.replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
      slug = slug.replace(/[-\s]+/g, '-')  // Replace spaces and multiple hyphens with single hyphen
      slug = slug.replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
      
      if (slug) {
        return slug
      }
    }
    
    // Fallback to date if no clean title
    return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`
  }
}
