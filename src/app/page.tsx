import PostList from '../components/PostList'
import { getRecentPosts } from '../lib/posts'
import { siteConfig } from '../lib/config'

export default async function HomePage() {
  try {
    const posts = await getRecentPosts(siteConfig.indexPostsLimit)
    
    return (
      <div>
        <PostList posts={posts} />
      </div>
    )
  } catch (error) {
    return (
      <div>
        <h1 className="f2 mb4">{siteConfig.siteName}</h1>
        <p className="f5 red">Error loading posts: {String(error)}</p>
      </div>
    )
  }
}
