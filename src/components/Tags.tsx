import Link from 'next/link'

interface TagsProps {
  tags: string[]
  className?: string
}

export default function Tags({ tags, className = '' }: TagsProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className={`tags ${className}`}>
      <div className="f6 gray mb2">Tags:</div>
      <div className="tag-list">
        {tags.map((tag) => (
          <Link 
            key={tag}
            href={`/tags/${tag}`}
            className="tag-link dib mr2 mb2 pa1 ph2 bg-light-gray gray hover-bg-moon-gray hover-dark-gray no-underline br2 f6"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  )
} 