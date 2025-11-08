'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  user: string
  text: string
  timestamp: string
  room: string
}

export default function CommunityPage() {
  const [activeRoom, setActiveRoom] = useState('general')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', user: 'TradeMaster', text: 'NVDA looking strong today!', timestamp: '10:30 AM', room: 'general' },
    { id: '2', user: 'AITrader', text: 'Just hit my target on TSLA 🎯', timestamp: '10:32 AM', room: 'general' },
    { id: '3', user: 'StockGuru', text: 'Anyone watching AMD?', timestamp: '10:35 AM', room: 'general' }
  ])

  const rooms = [
    { id: 'general', name: 'General Discussion', members: 156 },
    { id: 'ai-picks', name: 'AI Picks Analysis', members: 89 },
    { id: 'strategies', name: 'Trading Strategies', members: 124 },
    { id: 'newbies', name: 'Newbie Corner', members: 203 }
  ]

  function sendMessage() {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      user: 'You',
      text: message,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      room: activeRoom
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')
  }

  const roomMessages = messages.filter(m => m.room === activeRoom)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Community Chat</h1>
          <p className="text-gray-300">Connect with traders, share insights, and learn together</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Rooms Sidebar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Chat Rooms</h2>
            <div className="space-y-2">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full text-left p-4 rounded-lg transition ${
                    activeRoom === room.id
                      ? 'bg-blue-500/30 border-2 border-blue-400'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold text-white">{room.name}</div>
                  <div className="text-sm text-gray-400">{room.members} members</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">
                {rooms.find(r => r.id === activeRoom)?.name}
              </h2>
              <div className="text-gray-400 text-sm">
                {rooms.find(r => r.id === activeRoom)?.members} members online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {roomMessages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {msg.user[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{msg.user}</span>
                      <span className="text-xs text-gray-400">{msg.timestamp}</span>
                    </div>
                    <div className="text-gray-300">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-white/20">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-8 border border-white/20 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">💡 What This Means</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">Community:</strong> Connect with other traders to share insights, ask questions, and learn from collective wisdom.
            </p>
            <p>
              <strong className="text-white">Be Respectful:</strong> Share ideas, not financial advice. Remember everyone's at different skill levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
