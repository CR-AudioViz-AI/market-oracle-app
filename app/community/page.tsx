'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Post {
  id: string
  author: string
  symbol: string
  content: string
  timestamp: string
  likes: number
  replies: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostSymbol, setNewPostSymbol] = useState('')
  const [userId, setUserId] = useState('')
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])

  useEffect(() => {
    let uid = localStorage.getItem('market_oracle_user_id')
    if (!uid) {
      uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('market_oracle_user_id', uid)
    }
    setUserId(uid)

    loadPosts()
    loadAvailableSymbols()
  }, [])

  async function loadAvailableSymbols() {
    const { data } = await supabase
      .from('stock_picks')
      .select('symbol')
      .eq('status', 'OPEN')

    if (data) {
      const symbols = Array.from(new Set(data.map(p => p.symbol)))
      setAvailableSymbols(symbols)
    }
  }

  function loadPosts() {
    const savedPosts = localStorage.getItem('market_oracle_community_posts')
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts))
    }
  }

  function createPost() {
    if (!newPostContent.trim() || !newPostSymbol) {
      alert('Please fill in all fields')
      return
    }

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: userId.slice(-8),
      symbol: newPostSymbol,
      content: newPostContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: 0
    }

    const updatedPosts = [newPost, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem('market_oracle_community_posts', JSON.stringify(updatedPosts))

    setNewPostContent('')
    setNewPostSymbol('')
  }

  function likePost(postId: string) {
    const updatedPosts = posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    )
    setPosts(updatedPosts)
    localStorage.setItem('market_oracle_community_posts', JSON.stringify(updatedPosts))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold mb-2">💬 Community Discussion</h1>
        <p className="text-slate-400 mb-8">
          Share insights, discuss picks, and connect with other traders
        </p>

        {/* Instructions */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 mb-8">
          <h3 className="font-bold text-lg mb-3">💡 How to Use Community</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <strong>📝 Create Posts</strong>
              <p className="mt-1">Share your analysis, opinions, and questions about AI stock picks</p>
            </div>
            <div>
              <strong>👍 Engage</strong>
              <p className="mt-1">Like posts, reply to discussions, and build your reputation</p>
            </div>
            <div>
              <strong>🔍 Learn</strong>
              <p className="mt-1">See what other traders think about the same picks you're watching</p>
            </div>
            <div>
              <strong>🤝 Connect</strong>
              <p className="mt-1">Find traders with similar strategies and learn from their insights</p>
            </div>
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Post</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Symbol
              </label>
              <select
                value={newPostSymbol}
                onChange={(e) => setNewPostSymbol(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select stock...</option>
                {availableSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Thoughts
              </label>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your analysis, opinion, or question..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 resize-none"
              />
            </div>

            <button
              onClick={createPost}
              disabled={!newPostContent.trim() || !newPostSymbol}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              Post to Community
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Discussions ({posts.length})</h2>

          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold">
                      {post.author[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">User_{post.author}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(post.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                    ${post.symbol}
                  </span>
                </div>

                <p className="text-slate-300 mb-4">{post.content}</p>

                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => likePost(post.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-sm"
                  >
                    <span>👍</span>
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-sm">
                    <span>💬</span>
                    <span>{post.replies} Replies</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
              <div className="text-6xl mb-4">💬</div>
              <div className="text-2xl font-bold mb-2">No Posts Yet</div>
              <div className="text-slate-400">Be the first to start a discussion!</div>
            </div>
          )}
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h3 className="font-bold text-lg mb-3">🚀 Coming Soon</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-300">
            <div>✨ Direct messaging</div>
            <div>✨ User profiles</div>
            <div>✨ Follow traders</div>
            <div>✨ Reputation system</div>
            <div>✨ Advanced search</div>
            <div>✨ Trending discussions</div>
          </div>
        </div>
      </div>
    </div>
  )
}
