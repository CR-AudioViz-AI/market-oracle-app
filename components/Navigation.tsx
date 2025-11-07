"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

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
    <nav className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy border-b-2 border-brand-cyan/30 sticky top-0 z-50 shadow-lg shadow-brand-cyan/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-cyan to-brand-red rounded-full flex items-center justify-center">
              <span className="text-2xl">🔮</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-cyan to-white bg-clip-text text-transparent">
                Market Oracle
              </span>
              <div className="text-[10px] text-brand-cyan/60">Powered by CR AudioViz AI</div>
            </div>
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
                      ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800 border border-transparent'
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
