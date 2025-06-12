import path from 'path'
import { Post } from '@/types/post'
import { StudioLogParser } from './parser'
import { siteConfig } from './config'

let cachedPosts: Post[] | null = null

export async function getAllPosts(): Promise<Post[]> {
  if (cachedPosts) {
    return cachedPosts
  }

  const parser = new StudioLogParser()
  const filePath = path.join(process.cwd(), siteConfig.contentDir, siteConfig.contentFile)
  
  try {
    cachedPosts = await parser.parseFile(filePath)
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
