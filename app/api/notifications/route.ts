import { NextRequest, NextResponse } from 'next/server'

// In-memory notification store (in production, use database)
const notifications: Array<{
  id: string
  user_id: string
  type: 'price_alert' | 'ai_pick' | 'achievement' | 'system'
  title: string
  message: string
  created_at: string
  read: boolean
}> = []

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  // Return user's notifications
  const userNotifications = notifications
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)

  return NextResponse.json({
    notifications: userNotifications,
    unread_count: userNotifications.filter(n => !n.read).length
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: body.user_id,
    type: body.type,
    title: body.title,
    message: body.message,
    created_at: new Date().toISOString(),
    read: false
  }

  notifications.push(notification)

  return NextResponse.json({ success: true, notification })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { notification_id, read } = body

  const notification = notifications.find(n => n.id === notification_id)
  if (notification) {
    notification.read = read
  }

  return NextResponse.json({ success: true })
}
