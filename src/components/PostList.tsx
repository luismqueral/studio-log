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
        <article key={post.slug} className="mb5">
          <header className="mb3">
            <div className="f5 gray mb2">
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
              <h2 className="f3 ma0">
                <a href={`/${post.slug}/`} className="link black hover-blue">
                  {post.title}
                </a>
              </h2>
            )}
          </header>
          
          <div className="lh-copy">
            <MarkdownRenderer content={post.content} />
          </div>

          <Tags tags={post.tags} className="mt3" />
          
          {index < posts.length - 1 && (
            <hr className="post-separator bb b--light-gray mv4" />
          )}
        </article>
      ))}
    </div>
  )
}
