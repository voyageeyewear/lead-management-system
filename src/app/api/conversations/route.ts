import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const userPayload = verifyToken(token)
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Get conversations with lead details and last message
    const conversations = await prisma.conversation.findMany({
      where: {},
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Format conversations for the frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      lead: {
        id: conv.lead.id,
        firstName: conv.lead.firstName,
        lastName: conv.lead.lastName,
        email: conv.lead.email,
        phone: conv.lead.phone,
        company: conv.lead.company,
        avatar: null
      },
      assignedTo: conv.assignedTo ? {
        id: conv.assignedTo.id,
        name: conv.assignedTo.name,
        email: conv.assignedTo.email
      } : null,
      lastMessage: conv.messages[0]?.content || 'No messages yet',
      lastMessageAt: conv.lastMessageAt?.toISOString() || new Date().toISOString(),
      lastMessageDirection: conv.messages[0]?.direction || 'outbound',
      unreadCount: conv.unreadCount,
      isActive: conv.isActive,
      deliveryStatus: conv.messages[0]?.deliveryStatus
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const userPayload = verifyToken(token)
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: { leadId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation })
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        leadId,
        assignedToId: user.id,
        isActive: true
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}