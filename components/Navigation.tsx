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
    <nav className="bg-white border-b fixed top-0 left-0 right-0 z-[9999] shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/market-oracle-logo.png" 
              alt="Market Oracle" 
              width={50} 
              height={50}
              className="rounded-lg"
            />
            <div>
              <span className="text-xl font-bold text-white">Market Oracle</span>
              <div className="text-[10px] text-[#00CED1]/80">Powered by CR AudioViz AI</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-1 overflow-x-auto">
            {features.map((feature) => {
              const isActive = pathname === feature.href
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#00CED1]/20 text-[#00CED1] border border-[#00CED1]/30'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span>{feature.icon}</span>
                  <span>{feature.name}</span>
                </Link>
              )
            })}
          </div>

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
