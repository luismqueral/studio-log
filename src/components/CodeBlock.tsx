'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CopyIcon, CheckIcon } from '@primer/octicons-react'

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

  // Custom PreTag to inject the copy button directly inside <pre> (avoid double <pre>)
  const PreWithCopyButton = ({ children: preChildren }: { children: React.ReactNode }) => (
    <React.Fragment>
      <button
        onClick={copyToClipboard}
        className="copy-button"
        aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <CheckIcon size={12} fill="#116329" />
        ) : (
          <CopyIcon size={12} fill="#57606a" />
        )}
      </button>
      {preChildren}
    </React.Fragment>
  )

  return (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      customStyle={{
        margin: 0,
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
      wrapLines={true}
      showLineNumbers={false}
      codeTagProps={{
        style: {
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
        }
      }}
      PreTag={PreWithCopyButton}
    >
      {children}
    </SyntaxHighlighter>
  )
} 