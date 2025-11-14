'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Show help with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowHelp(true)
        return
      }

      // Close help with Escape
      if (e.key === 'Escape') {
        setShowHelp(false)
        return
      }

      // Navigation shortcuts (only when not typing in input/textarea)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl/Cmd + Key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k': // Search
            e.preventDefault()
            // Focus search if available
            break
          case 'h': // Home
            e.preventDefault()
            router.push('/')
            break
          case 'b': // Backtesting
            e.preventDefault()
            router.push('/backtesting')
            break
          case 'p': // Paper Trading
            e.preventDefault()
            router.push('/paper-trading')
            break
          case 'v': // Voting
            e.preventDefault()
            router.push('/voting')
            break
        }
      }

      // Single key shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        switch(e.key) {
          case 'g':
            // Next: g + another key for navigation
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router])

  if (!showHelp) {
    return (
      <div className="fixed bottom-6 left-6 text-slate-500 text-xs z-40">
        Press <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">?</kbd> for shortcuts
      </div>
    )
  }

  const shortcuts = [
    { key: '?', description: 'Show this help' },
    { key: 'Esc', description: 'Close modals/help' },
    { key: 'Ctrl+H', description: 'Go to Dashboard' },
    { key: 'Ctrl+B', description: 'Go to Backtesting' },
    { key: 'Ctrl+P', description: 'Go to Paper Trading' },
    { key: 'Ctrl+V', description: 'Go to Voting' },
    { key: 'Ctrl+K', description: 'Search (Coming Soon)' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl p-8 max-w-lg w-full border border-blue-500/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">⌨️ Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <kbd className="px-3 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-sm">
                {shortcut.key}
              </kbd>
              <span className="text-slate-400 text-sm">{shortcut.description}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-500">
          <p>💡 Tip: Use Ctrl (Windows/Linux) or Cmd (Mac) for navigation shortcuts</p>
        </div>
      </div>
    </div>
  )
}
