import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const WEBHOOK_SECRET = process.env.INTERAKT_WEBHOOK_SECRET || '2e0f0a2b-f141-4b52-8b0d-f4973f6a7400'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Interakt-Signature')
    const body = await request.json()

    // In a real application, you would verify the signature
    // For now, we'll just log and process
    console.log('Interakt Webhook Received:', JSON.stringify(body, null, 2))

    // Handle different webhook events
    const { event, data } = body

    switch (event) {
      case 'message.status.updated':
        await handleMessageStatus(data)
        break
      case 'message.received':
        await handleMessageReceived(data)
        break
      case 'message.sent':
        await handleMessageSent(data)
        break
      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ success: true, message: 'Webhook received' }, { status: 200 })
  } catch (error) {
    console.error('Error processing Interakt webhook:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

// Handle WhatsApp verification webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === WEBHOOK_SECRET) {
    console.log('Webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

async function handleMessageStatus(data: any) {
  try {
    const { messageId, status, phoneNumber, callbackData } = data
    console.log(`Message ${messageId} to ${phoneNumber} status updated to: ${status}`)

    // Update message delivery status in database
    if (messageId) {
      await prisma.message.updateMany({
        where: {
          whatsappMessageId: messageId
        },
        data: {
          deliveryStatus: status.toLowerCase()
        }
      })
    }

    // Update activity status if callbackData contains lead info
    if (callbackData && callbackData.startsWith('lead_')) {
      const leadId = callbackData.replace('lead_', '')
      
      const activities = await prisma.activity.findMany({
        where: {
          leadId: leadId,
          type: {
            in: ['WHATSAPP_MESSAGE', 'BULK_WHATSAPP']
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      })

      if (activities.length > 0) {
        let activityStatus = 'COMPLETED'
        let description = `WhatsApp message ${status}`

        switch (status.toLowerCase()) {
          case 'failed':
            activityStatus = 'CANCELLED'
            description = 'WhatsApp message failed to send'
            break
          case 'delivered':
            description = 'WhatsApp message delivered'
            break
          case 'read':
            description = 'WhatsApp message read by recipient'
            break
        }

        await prisma.activity.update({
          where: { id: activities[0].id },
          data: {
            status: activityStatus,
            description: `${activities[0].description}\n\nStatus: ${description}`
          }
        })
      }
    }

  } catch (error) {
    console.error('Error handling message status:', error)
  }
}

async function handleMessageReceived(data: any) {
  try {
    const { messageId, phoneNumber, message, timestamp } = data

    console.log(`Message received from ${phoneNumber}: ${message}`)

    // Clean phone number for matching
    const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/^\+/, '').slice(-10)

    // Try to find the lead by phone number
    const lead = await prisma.lead.findFirst({
      where: {
        phone: {
          contains: cleanPhone
        }
      }
    })

    if (lead) {
      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { leadId: lead.id }
      })

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            leadId: lead.id,
            assignedToId: lead.assignedToId,
            isActive: true,
            lastMessage: message,
            lastMessageAt: new Date(),
            unreadCount: 1
          }
        })
      } else {
        // Update conversation with new message
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: message,
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 }
          }
        })
      }

      // Create message record
      await prisma.message.create({
        data: {
          content: message,
          direction: 'inbound',
          messageType: 'text',
          whatsappMessageId: messageId,
          conversationId: conversation.id,
          deliveryStatus: 'delivered'
        }
      })

      // Create an activity for the received message
      if (lead.assignedToId || lead.createdById) {
        await prisma.activity.create({
          data: {
            type: 'WHATSAPP_RECEIVED',
            title: `WhatsApp message received from ${lead.firstName} ${lead.lastName}`,
            description: `Message: "${message}"`,
            status: 'COMPLETED',
            priority: 'MEDIUM',
            leadId: lead.id,
            assignedToId: lead.assignedToId || lead.createdById,
            createdById: lead.createdById || lead.assignedToId,
          }
        })
      }

      // Update lead's last contacted date
      await prisma.lead.update({
        where: { id: lead.id },
        data: { lastContactedAt: new Date() }
      })

      console.log(`Incoming message processed for lead: ${lead.firstName} ${lead.lastName}`)
    } else {
      console.log(`No lead found for phone number: ${phoneNumber}`)
      
      // Optionally create a new lead for unknown contacts
      // This could be configurable based on business requirements
    }

  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

async function handleMessageSent(data: any) {
  try {
    const { messageId, phoneNumber, message, timestamp } = data
    console.log(`Message sent to ${phoneNumber}: ${message}`)

    // Update message status in database
    if (messageId) {
      await prisma.message.updateMany({
        where: {
          whatsappMessageId: messageId
        },
        data: {
          deliveryStatus: 'sent'
        }
      })
    }

  } catch (error) {
    console.error('Error handling message sent:', error)
  }
}