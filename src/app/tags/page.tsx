import { getAllPosts } from '../../lib/posts'
import Link from 'next/link'

export default async function TagsPage() {
  const posts = await getAllPosts()
  
  // Calculate tag counts
  const tagCounts = new Map<string, number>()
  posts.forEach(post => {
    post.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  
  // Sort tags by post count (descending) then alphabetically
  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1] // Sort by count descending
      return a[0].localeCompare(b[0]) // Then alphabetically
    })
  
  if (sortedTags.length === 0) {
    return (
      <div>
        <div className="mb4">
          <Link href="/" className="link blue hover-dark-blue">← Back to all posts</Link>
        </div>
        <h1 className="f2 mb4">Tags</h1>
        <p className="f5 gray">No tags found.</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="mb4">
        <Link href="/" className="link blue hover-dark-blue">← Back to all posts</Link>
      </div>
      
      <header className="mb5">
        <h1 className="f2 mb2">Tags</h1>
        <p className="f5 gray">
          {sortedTags.length} tag{sortedTags.length !== 1 ? 's' : ''} across {posts.length} posts
        </p>
      </header>
      
      <div className="tag-cloud">
        {sortedTags.map(([tag, count]) => (
          <Link 
            key={tag}
            href={`/tags/${tag}`}
            className="tag-item dib mr3 mb3 pv3 ph4 bg-near-white hover-bg-light-blue no-underline br-pill transition-all"
            style={{
              border: '1px solid #e0e0e0',
              transition: 'all 0.2s ease'
            }}
          >
            <span className="tag-name f4 dark-gray hover-white fw5">#{tag}</span>
            <span className="tag-count f6 gray hover-white ml2">({count})</span>
          </Link>
        ))}
      </div>
    </div>
  )
} 