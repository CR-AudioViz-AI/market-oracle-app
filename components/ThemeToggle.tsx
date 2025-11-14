'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('market_oracle_theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      applyTheme(saved)
    }
  }, [])

  function applyTheme(newTheme: 'dark' | 'light') {
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  }

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('market_oracle_theme', newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition z-40 border border-white/20"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
