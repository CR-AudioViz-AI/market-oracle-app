"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const features = [
  { name: 'AI Battle', href: '/', icon: '🏠' },
  { name: 'Portfolio', href: '/portfolio', icon: '📊' },
  { name: 'Backtesting', href: '/backtesting', icon: '📈' },
  { name: 'Watchlist', href: '/watchlist', icon: '⭐' },
  { name: 'Hot Picks', href: '/hot-picks', icon: '🔥' },
  { name: 'Insights', href: '/insights', icon: '💡' },
  { name: 'Charts', href: '/charts', icon: '📉' },
  { name: 'Voting', href: '/voting', icon: '🗳️' },
  { name: 'Paper Trade', href: '/paper-trading', icon: '💰' },
  { name: 'Community', href: '/community', icon: '👥' },
  { name: 'Learn', href: '/learn', icon: '📚' },
  { name: 'Sectors', href: '/sectors', icon: '🏢' },
  { name: 'Alerts', href: '/alerts', icon: '🔔' },
  { name: 'Export', href: '/export', icon: '📥' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-slate-900 border-b border-purple-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Market Oracle
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 overflow-x-auto">
            {features.map((feature) => {
              const isActive = pathname === feature.href
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{feature.icon}</span>
                  <span>{feature.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
