import { Post } from '@/types/post'
import MarkdownRenderer from './MarkdownRenderer'
import Tags from './Tags'

interface PostListProps {
  posts: Post[]
}

export default function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <div><p className="f5 gray">No posts found.</p></div>;
  }
  return (
    <div className="posts-list">
      {posts.map((post, index) => (
        <article key={post.slug} className="mb4 mb5-ns pa3 pa4-ns bg-white br2">
          <header className="mb3 mb3-ns">
            <div className="f7 f6-ns gray mb3 mb3-ns">
              <a href={`/${post.slug}/`} className="link gray hover-blue">
                <time className="post-date" dateTime={post.date.toISOString()}>
                  {post.date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </a>
            </div>
            {post.hasTitle && (
              <h2 className="f4 f3-ns lh-title ma0">
                <a href={`/${post.slug}/`} className="link black underline-hover">
                  {post.title}
                </a>
              </h2>
            )}
          </header>
          
          <div className="f6 f5-ns lh-copy">
            <MarkdownRenderer content={post.content} />
          </div>

          <Tags tags={post.tags} className="mt4 mt5-ns" />
        </article>
      ))}
    </div>
  )
}
