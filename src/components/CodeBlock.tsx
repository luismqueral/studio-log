'use client'

import React, { useState, Suspense, lazy } from 'react'
import { CopyIcon, CheckIcon } from '@primer/octicons-react'

// Dynamically import SyntaxHighlighter to reduce initial bundle size
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism
  }))
)

// Dynamically import only the theme we need
const loadTheme = () => 
  import('react-syntax-highlighter/dist/esm/styles/prism').then(module => module.oneDark)

interface CodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

// Fallback component for when SyntaxHighlighter is loading
const CodeFallback = ({ children }: { children: string }) => (
  <pre style={{
    background: '#282c34',
    color: '#abb2bf',
    padding: '16px',
    borderRadius: '6px',
    overflow: 'auto',
    fontSize: '14px',
    lineHeight: '1.45',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
  }}>
    <code>{children}</code>
  </pre>
)

export default function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState<{ [key: string]: React.CSSProperties } | null>(null)
  
  // Extract language from className (format: "language-javascript")
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  
  // Load theme on first render
  React.useEffect(() => {
    loadTheme().then(setTheme)
  }, [])
  
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

  // Custom PreTag to inject the copy button directly inside <pre>
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

  // If theme hasn't loaded yet, show fallback
  if (!theme) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={copyToClipboard}
          className="copy-button"
          style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <CheckIcon size={12} fill="#116329" />
          ) : (
            <CopyIcon size={12} fill="#57606a" />
          )}
        </button>
        <CodeFallback>{children}</CodeFallback>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div style={{ position: 'relative' }}>
        <button
          onClick={copyToClipboard}
          className="copy-button"
          style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <CheckIcon size={12} fill="#116329" />
          ) : (
            <CopyIcon size={12} fill="#57606a" />
          )}
        </button>
        <CodeFallback>{children}</CodeFallback>
      </div>
    }>
      <SyntaxHighlighter
        language={language}
        style={theme}
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
    </Suspense>
  )
} 