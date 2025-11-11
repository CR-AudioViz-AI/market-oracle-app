'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Battle Royale', href: '/battle' },
  { name: 'Hot Picks', href: '/hot-picks' },
  { name: 'AI Insights', href: '/insights' },
  { name: 'Charts', href: '/charts' },
  { name: 'Backtesting', href: '/backtesting' },
  { name: 'Voting', href: '/voting' },
  { name: 'Paper Trading', href: '/paper-trading' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Watchlist', href: '/watchlist' },
  { name: 'Community', href: '/community' },
  { name: 'Learn', href: '/learn' },
  { name: 'Alerts', href: '/alerts' },
  { name: 'Sectors', href: '/sectors' },
  { name: 'Export', href: '/export' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group">
            <div className="relative w-14 h-14 transition-transform group-hover:scale-105">
              <Image
                src="https://raw.githubusercontent.com/CR-AudioViz-AI/crav-website/main/public/marketoracle.png"
                alt="Market Oracle"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-navy/20 text-brand-cyan border border-brand-cyan/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden pb-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-navy/20 text-brand-cyan border border-brand-cyan/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
