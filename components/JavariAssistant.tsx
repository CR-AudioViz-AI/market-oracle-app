'use client'

import { useState } from 'react'

export default function JavariAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: 'Hi! I\'m Javari, your AI trading assistant. Ask me anything about Market Oracle!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const response = getJavariResponse(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setLoading(false)
    }, 1000)
  }

  function getJavariResponse(question: string): string {
    const q = question.toLowerCase()
    
    if (q.includes('hot pick') || q.includes('best stock')) {
      return 'Hot Picks are stocks chosen by 2+ AI models OR with 85%+ confidence from a single AI. Check the dashboard to see current hot picks!'
    }
    if (q.includes('backtest')) {
      return 'Backtesting lets you test strategies against historical data. Go to the Backtesting page, select your strategy and date range, then click "Run Backtest" to see how it would have performed.'
    }
    if (q.includes('paper trad')) {
      return 'Paper Trading gives you $100K virtual money to practice. Select a stock, enter quantity, and click BUY/SELL. Your positions update in real-time with no risk!'
    }
    if (q.includes('confidence')) {
      return 'Confidence scores (0-100%) show how strongly an AI believes in its pick. Generally, 70%+ is moderate confidence, 85%+ is high confidence worth considering.'
    }
    if (q.includes('sector')) {
      return 'Sectors group similar companies (Tech, Healthcare, Finance, etc.). Diversifying across sectors reduces risk. Check the Sectors page to see where AIs are focusing.'
    }
    if (q.includes('vote') || q.includes('voting')) {
      return 'Vote Bullish if you agree with an AI pick, Bearish if you disagree. Community sentiment helps validate picks - high consensus is a good sign!'
    }
    
    return 'Great question! For detailed help, check out our Learning Center with comprehensive tutorials. You can also explore each page - they all have built-in instructions.'
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 transition-transform z-50 animate-pulse"
        title="Ask Javari AI"
      >
        🤖
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 rounded-2xl shadow-2xl border border-blue-500/30 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <div className="font-bold text-white">Javari AI</div>
            <div className="text-xs text-blue-100">Your Trading Assistant</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-blue-200 transition text-2xl"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-200 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white rounded-lg transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
