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
    <article className="measure lh-copy">
      <header className="mb4">
        <div className="f5 gray mb3">
          <time className="post-date" dateTime={post.date.toISOString()}>
            {post.date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
        </div>
        {post.hasTitle && (
          <h1 className="f1 ma0">{post.title}</h1>
        )}
      </header>
      
      <div className="post-content lh-copy f5">
        <MarkdownRenderer content={post.content} />
      </div>
      
      <Tags tags={post.tags} className="mt4 pb4 bb b--light-gray" />
      
      <footer className="mt5">
        <div className="post-navigation flex justify-between bt b--light-gray pt4">
          {prevPost ? (
            <a 
              href={`/${prevPost.slug}/`} 
              className="nav-previous link blue hover-dark-blue"
            >
              ← {prevPost.title}
            </a>
          ) : (
            <span></span>
          )}
          
          {nextPost ? (
            <a 
              href={`/${nextPost.slug}/`} 
              className="nav-next link blue hover-dark-blue"
            >
              {nextPost.title} →
            </a>
          ) : (
            <span></span>
          )}
        </div>
      </footer>
    </article>
  )
}
