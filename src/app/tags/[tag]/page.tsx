import { getAllPosts } from '../../../lib/posts'
import PostList from '../../../components/PostList'
import Link from 'next/link'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  const allTags = new Set<string>()
  
  posts.forEach(post => {
    post.tags.forEach(tag => allTags.add(tag))
  })
  
  return Array.from(allTags).map(tag => ({
    tag: tag
  }))
}

export default async function TagPage({ 
  params 
}: { 
  params: Promise<{ tag: string }> 
}) {
  const { tag } = await params
  const posts = await getAllPosts()
  const filteredPosts = posts.filter(post => post.tags.includes(tag))
  
  if (filteredPosts.length === 0) {
    return (
      <div>
        <div className="mb4">
          <Link href="/" className="link blue hover-dark-blue">← Back to all posts</Link>
        </div>
        <h1 className="f2 mb4">#{tag}</h1>
        <p className="f5 gray">No posts found with this tag.</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb4">
        <Link href="/" className="link blue hover-dark-blue">← Back to all posts</Link>
      </div>
      
      <header className="mb5">
        <div className="mb3">
          <span 
            className="dib pv2 ph4 bg-light-blue white br-pill f3 fw6"
            style={{
              border: '1px solid #357edd'
            }}
          >
            #{tag}
          </span>
        </div>
        <p className="f5 gray">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} tagged with this
        </p>
      </header>
      
      <PostList posts={filteredPosts} />
    </div>
  )
} 