import { getAllPosts } from '../../lib/posts'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import Tags from '../../components/Tags'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(post => ({
    slug: post.slug
  }))
}

export default async function PostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const posts = await getAllPosts()
  const post = posts.find(p => p.slug === slug)
  
  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
      </div>
    )
  }
  
  const currentIndex = posts.findIndex(p => p.slug === slug)
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null
  
  return (
    <article className="mb4 mb5-ns pa3 pa4-ns bg-white br2">
      <header className="mb3 mb3-ns">
        <div className="f7 f6-ns gray">
          <time className="post-date" dateTime={post.date.toISOString()}>
            {post.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
        </div>
        {post.hasTitle && (
          <h1 className="f3 f2-ns lh-title ma0 mt3">{post.title}</h1>
        )}
      </header>
      
      <div className="post-content f6 f5-ns lh-copy measure-wide">
        <MarkdownRenderer content={post.content} />
      </div>
      
      <Tags tags={post.tags} className="mt4 mt5-ns" />
      
      <footer className="mt2 mt3-ns">
        <div className="post-navigation flex justify-between pt3 pt4-ns">
          {prevPost ? (
            <a 
              href={`/${prevPost.slug}/`} 
              className="nav-previous link blue hover-dark-blue hover-underline f6 f5-ns"
            >
              ← Previous Post
            </a>
          ) : (
            <span></span>
          )}
          
          {nextPost ? (
            <a 
              href={`/${nextPost.slug}/`} 
              className="nav-next link blue hover-dark-blue hover-underline f6 f5-ns"
            >
              Next Post →
            </a>
          ) : (
            <span></span>
          )}
        </div>
      </footer>
    </article>
  )
}
