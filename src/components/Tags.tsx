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
      <div className="flex items-center flex-wrap">
        <span className="f6 gray mr3">Tags:</span>
        {tags.map((tag) => (
          <Link 
            key={tag}
            href={`/tags/${tag}`}
            className="tag-pill dib mr2 mb2 pv2 ph3 bg-near-white dark-gray hover-bg-light-blue hover-white no-underline br-pill f6 fw5 transition-all"
            style={{
              border: '1px solid #e0e0e0',
              transition: 'all 0.2s ease'
            }}
          >
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  )
} 