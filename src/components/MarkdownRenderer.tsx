'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import CodeBlock from './CodeBlock'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const childrenString = String(children).replace(/\n$/, '')
            
            return (
              <CodeBlock
                className={className}
                inline={inline}
                {...props}
              >
                {childrenString}
              </CodeBlock>
            )
          },
          // You can customize other elements here too
          h1: ({ children }) => (
            <h1 className="f2 lh-title mb3 mt4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="f3 lh-title mb3 mt4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="f4 lh-title mb3 mt3">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="lh-copy mb3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="lh-copy mb3 pl3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="lh-copy mb3 pl3">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="bl bw2 b--light-gray pl3 ml0 italic gray">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="link blue hover-dark-blue">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 