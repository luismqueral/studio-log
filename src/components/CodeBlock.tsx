'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

export default function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  // Extract language from className (format: "language-javascript")
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  
  // For inline code, just return a simple code element
  if (inline) {
    return (
      <code className="inline-code">
        {children}
      </code>
    )
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="code-block-container">
      <button
        onClick={copyToClipboard}
        className="code-block-copy-button"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
      
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
          }
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
} 