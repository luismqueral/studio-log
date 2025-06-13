import path from 'path'
import fs from 'fs'
import { Post } from '@/types/post'
import { StudioLogParser } from './parser'
import { siteConfig } from './config'

let cachedPosts: Post[] | null = null

export async function getAllPosts(): Promise<Post[]> {
  if (cachedPosts) {
    return cachedPosts
  }

  const parser = new StudioLogParser()
  const contentDir = path.join(process.cwd(), siteConfig.contentDir)
  
  try {
    // Read all markdown files from the content directory
    const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'))
    const allPosts: Post[] = []
    
    for (const file of files) {
      const filePath = path.join(contentDir, file)
      const posts = await parser.parseFile(filePath)
      allPosts.push(...posts)
    }
    
    // Sort posts by date (newest first)
    cachedPosts = allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return cachedPosts
  } catch (error) {
    console.error('Error loading posts:', error)
    return []
  }
}

export async function getRecentPosts(limit: number = 10): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.slice(0, limit)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts()
  return posts.find(post => post.slug === slug) || null
}
