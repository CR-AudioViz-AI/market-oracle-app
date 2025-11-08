'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  Send,
  Users,
  TrendingUp,
  Lightbulb,
  Smile,
  Clock,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  user_name: string;
  message: string;
  ticker?: string;
  created_at: string;
  likes: number;
  room_id: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  message_count: number;
  active_users: number;
}

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'Talk about markets, stocks, and investing strategies',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    message_count: 0,
    active_users: 0
  },
  {
    id: 'ai-picks',
    name: 'AI Picks Discussion',
    description: 'Discuss AI stock recommendations and performance',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
    message_count: 0,
    active_users: 0
  },
  {
    id: 'strategies',
    name: 'Trading Strategies',
    description: 'Share your trading strategies and tactics',
    icon: <Lightbulb className="w-5 h-5" />,
    color: 'from-yellow-500 to-orange-500',
    message_count: 0,
    active_users: 0
  },
  {
    id: 'memes',
    name: 'Memes & Fun',
    description: 'Relax and share trading memes',
    icon: <Smile className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500',
    message_count: 0,
    active_users: 0
  }
];

// Demo messages for showcase
const DEMO_MESSAGES: Record<string, Message[]> = {
  general: [
    {
      id: '1',
      user_name: 'TraderMike',
      message: 'Anyone watching NVDA today? Looking strong!',
      ticker: 'NVDA',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      likes: 5,
      room_id: 'general'
    },
    {
      id: '2',
      user_name: 'InvestorSarah',
      message: 'Just hit my first 10% gain on paper trading! The AI picks are really helping me learn.',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      likes: 12,
      room_id: 'general'
    },
    {
      id: '3',
      user_name: 'BullishBob',
      message: 'Market looking green today 📈 Great day for growth stocks',
      created_at: new Date(Date.now() - 900000).toISOString(),
      likes: 8,
      room_id: 'general'
    },
    {
      id: '4',
      user_name: 'TechAnalyst',
      message: 'Anyone else think tech sector is overheated? Might be due for a correction',
      created_at: new Date(Date.now() - 300000).toISOString(),
      likes: 3,
      room_id: 'general'
    }
  ],
  'ai-picks': [
    {
      id: '5',
      user_name: 'AIEnthusiast',
      message: 'GPT-4 picked MSFT at $380 and it\'s now at $399! These AI models are impressive',
      ticker: 'MSFT',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      likes: 15,
      room_id: 'ai-picks'
    },
    {
      id: '6',
      user_name: 'DataDriven',
      message: 'Has anyone analyzed which AI model has the best win rate? I\'m seeing Claude leading',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      likes: 7,
      room_id: 'ai-picks'
    },
    {
      id: '7',
      user_name: 'QuantTrader',
      message: 'The AI consensus picks (where all 4 AIs agree) have a 78% success rate! That\'s incredible',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      likes: 22,
      room_id: 'ai-picks'
    },
    {
      id: '8',
      user_name: 'MarketWatcher',
      message: 'Perplexity just picked AMD - their last 5 picks are all winners. Following this one closely',
      ticker: 'AMD',
      created_at: new Date(Date.now() - 600000).toISOString(),
      likes: 11,
      room_id: 'ai-picks'
    }
  ],
  strategies: [
    {
      id: '9',
      user_name: 'StrategyPro',
      message: 'My strategy: Only follow picks where 3+ AIs agree. Down to 65% success rate',
      created_at: new Date(Date.now() - 5400000).toISOString(),
      likes: 18,
      room_id: 'strategies'
    },
    {
      id: '10',
      user_name: 'RiskManager',
      message: 'I set stop losses at -8% and take profits at +15%. Been working well so far!',
      created_at: new Date(Date.now() - 2700000).toISOString(),
      likes: 14,
      room_id: 'strategies'
    },
    {
      id: '11',
      user_name: 'DividendHunter',
      message: 'Combining AI picks with dividend yield analysis. Looking for high-conviction dividend stocks',
      created_at: new Date(Date.now() - 900000).toISOString(),
      likes: 9,
      room_id: 'strategies'
    }
  ],
  memes: [
    {
      id: '12',
      user_name: 'MemeKing',
      message: 'When the AI picks are green but you forgot to actually buy 😭',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      likes: 34,
      room_id: 'memes'
    },
    {
      id: '13',
      user_name: 'DiamondHands',
      message: 'POV: You\'re waiting for the AI to pick your favorite stock',
      created_at: new Date(Date.now() - 900000).toISOString(),
      likes: 28,
      room_id: 'memes'
    },
    {
      id: '14',
      user_name: 'RocketMan',
      message: 'AI: "This stock will moon" Stock: goes up 0.3% Me: TO THE MOON! 🚀🚀🚀',
      created_at: new Date(Date.now() - 300000).toISOString(),
      likes: 42,
      room_id: 'memes'
    }
  ]
};

export default function CommunityPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [currentUser, setCurrentUser] = useState<string>('Guest' + Math.floor(Math.random() * 1000));
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>(CHAT_ROOMS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Try to get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUser(user.email.split('@')[0]);
      }

      // Load messages for default room
      loadMessages('general');
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      loadMessages('general');
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      // Try to load from database
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data && data.length > 0) {
        setMessages(data);
      } else {
        // Fallback to demo messages
        setMessages(DEMO_MESSAGES[roomId] || []);
      }

      // Update room stats
      updateRoomStats(roomId);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Use demo messages
      setMessages(DEMO_MESSAGES[roomId] || []);
    }
  };

  const updateRoomStats = (roomId: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          message_count: messages.length,
          active_users: Math.floor(Math.random() * 50) + 10
        };
      }
      return room;
    }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        user_name: currentUser,
        message: newMessage,
        created_at: new Date().toISOString(),
        likes: 0,
        room_id: selectedRoom
      };

      // Try to insert into database
      try {
        const { data, error } = await supabase
          .from('community_messages')
          .insert([{
            user_name: currentUser,
            message: newMessage,
            room_id: selectedRoom,
            likes: 0
          }])
          .select()
          .single();

        if (!error && data) {
          setMessages([...messages, data]);
        } else {
          // Fallback to local state
          setMessages([...messages, message]);
        }
      } catch (dbError) {
        // Demo mode - add locally
        setMessages([...messages, message]);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const likeMessage = async (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg
    ));

    // Try to update in database
    try {
      await supabase
        .from('community_messages')
        .update({ likes: messages.find(m => m.id === messageId)!.likes + 1 })
        .eq('id', messageId);
    } catch (error) {
      // Demo mode - already updated locally
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
          💬 Community
        </h1>
        <p className="text-xl text-gray-300 mb-2">Connect with traders and investors</p>
        <p className="text-gray-400">Share insights, strategies, and learn from others</p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">
              {rooms.reduce((sum, r) => sum + r.message_count, 0) + messages.length}
            </div>
            <div className="text-sm text-gray-400">Total Messages</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">
              {rooms.reduce((sum, r) => sum + r.active_users, 0)}
            </div>
            <div className="text-sm text-gray-400">Active Users</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-400">4</div>
            <div className="text-sm text-gray-400">Chat Rooms</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-pink-500/20">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-pink-400">
              {messages.reduce((sum, m) => sum + m.likes, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Likes</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Room Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Chat Rooms</CardTitle>
              <CardDescription>Select a room to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedRoom === room.id
                      ? 'bg-gradient-to-r ' + room.color + ' text-white'
                      : 'bg-slate-900/50 hover:bg-slate-900 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {room.icon}
                    <span className="font-bold">{room.name}</span>
                  </div>
                  <p className={`text-xs ${selectedRoom === room.id ? 'text-white/80' : 'text-gray-400'}`}>
                    {room.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.active_users || Math.floor(Math.random() * 50) + 10}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {DEMO_MESSAGES[room.id]?.length || 0}
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* User Info */}
          <Card className="bg-slate-800/50 border-purple-500/20 mt-4">
            <CardHeader>
              <CardTitle className="text-white text-sm">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {currentUser[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white">{currentUser}</div>
                  <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    {rooms.find(r => r.id === selectedRoom)?.name}
                  </CardTitle>
                  <CardDescription>
                    {rooms.find(r => r.id === selectedRoom)?.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
                  <Users className="w-3 h-3 mr-1" />
                  {Math.floor(Math.random() * 50) + 10} online
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages Area */}
              <div className="bg-slate-900/50 rounded-lg p-4 h-[500px] overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No messages yet. Be the first to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="group">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {message.user_name[0].toUpperCase()}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-white">{message.user_name}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(message.created_at)}
                              </span>
                              {message.ticker && (
                                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
                                  ${message.ticker}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-300 mb-2">{message.message}</p>
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => likeMessage(message.id)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-400 transition-colors"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                {message.likes > 0 && <span>{message.likes}</span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${rooms.find(r => r.id === selectedRoom)?.name}...`}
                  className="flex-grow bg-slate-900/50 border-gray-700 text-white"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
