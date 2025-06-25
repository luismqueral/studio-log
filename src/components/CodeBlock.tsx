'use client'

import React, { useState } from 'react'
import { CopyIcon, CheckIcon } from '@primer/octicons-react'

interface CodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

// Simple syntax highlighting with basic language detection
const getLanguageClass = (language: string) => {
  const languageMap: { [key: string]: string } = {
    javascript: 'language-javascript',
    typescript: 'language-typescript',
    jsx: 'language-jsx',
    tsx: 'language-tsx',
    python: 'language-python',
    css: 'language-css',
    html: 'language-html',
    json: 'language-json',
    markdown: 'language-markdown',
    bash: 'language-bash',
    shell: 'language-shell',
    sql: 'language-sql',
    yaml: 'language-yaml',
    xml: 'language-xml'
  }
  return languageMap[language] || 'language-text'
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
    <div style={{ position: 'relative' }}>
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
      <pre className={`code-block ${getLanguageClass(language)}`}>
        <code>{children}</code>
      </pre>
    </div>
  )
} 