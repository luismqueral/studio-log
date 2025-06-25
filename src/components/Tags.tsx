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
    <div className={className}>
      <div className="flex items-center flex-wrap">
        {tags.map((tag) => (
          <Link 
            key={tag}
            href={`/tags/${tag}`}
            className="f7 f6-ns bg-near-white hover-bg-light-gray br2 pa2 link gray hover-blue mr3 mb2"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  )
} 