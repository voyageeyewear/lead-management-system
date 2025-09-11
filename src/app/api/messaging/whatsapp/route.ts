import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Interakt WhatsApp API configuration
const INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/'
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY || 'bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo='
const INTERAKT_DECODED_KEY = 'l5CFrWoSTVdq_LSq6A5RAs2hAQd9xjX5gh01QT-SsPk'

interface WhatsAppMessage {
  countryCode: string
  phoneNumber: string
  callbackData?: string
  type: string
  template?: {
    name: string
    languageCode: string
    headerValues?: string[]
    bodyValues?: string[]
  }
  data?: {
    message: string
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

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { leads, message, messageType, templateName, mode } = await request.json()

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let successCount = 0
    let failedCount = 0
    const results = []

    // Process each lead
    for (const lead of leads) {
      if (!lead.phone) {
        failedCount++
        results.push({
          leadId: lead.id,
          status: 'failed',
          error: 'No phone number'
        })
        continue
      }

      try {
        // Clean and format phone number
        const cleanPhone = lead.phone.replace(/\D/g, '')
        let phoneNumber = cleanPhone
        let countryCode = '91' // Default to India

        // Extract country code if phone number is longer than 10 digits
        if (cleanPhone.length > 10) {
          countryCode = cleanPhone.substring(0, cleanPhone.length - 10)
          phoneNumber = cleanPhone.substring(cleanPhone.length - 10)
        }

        // Personalize message
        const personalizedMessage = message
          .replace(/\{\{name\}\}/g, `${lead.firstName} ${lead.lastName}`)
          .replace(/\{\{company\}\}/g, lead.company || 'your company')
          .replace(/\{\{phone\}\}/g, lead.phone)

        // Prepare WhatsApp message payload
        const whatsappMessage: WhatsAppMessage = {
          countryCode,
          phoneNumber,
          callbackData: `lead_${lead.id}`,
          type: messageType === 'template' ? 'Template' : 'Text',
        }

        if (messageType === 'template' && templateName) {
          // Use full name for template variable
          const fullName = `${lead.firstName} ${lead.lastName}`.trim()
          
          whatsappMessage.template = {
            name: templateName.toLowerCase().replace(/\s+/g, '_'),
            languageCode: 'en',
            bodyValues: [fullName]
          }
        } else {
          whatsappMessage.data = {
            message: personalizedMessage
          }
        }

        // Send message via Interakt API
        const response = await fetch(INTERAKT_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(INTERAKT_DECODED_KEY + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(whatsappMessage),
        })

        if (response.ok) {
          const result = await response.json()
          successCount++
          results.push({
            leadId: lead.id,
            status: 'success',
            messageId: result.messageId || result.id,
            response: result
          })

          // Create or update conversation and message records
          try {
            const existingLead = await prisma.lead.findUnique({
              where: { id: lead.id },
              select: { id: true }
            })

            if (existingLead) {
              // Find or create conversation
              let conversation = await prisma.conversation.findFirst({
                where: { leadId: lead.id }
              })

              if (!conversation) {
                conversation = await prisma.conversation.create({
                  data: {
                    leadId: lead.id,
                    assignedToId: user.id,
                    isActive: true,
                    lastMessage: personalizedMessage,
                    lastMessageAt: new Date(),
                    unreadCount: 0
                  }
                })
              } else {
                // Update conversation with new message
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: {
                    lastMessage: personalizedMessage,
                    lastMessageAt: new Date()
                  }
                })
              }

              // Create message record
              await prisma.message.create({
                data: {
                  content: personalizedMessage,
                  direction: 'outbound',
                  messageType: messageType || 'text',
                  templateName: templateName,
                  whatsappMessageId: result.messageId || result.id,
                  conversationId: conversation.id,
                  senderId: user.id,
                  deliveryStatus: 'sent'
                }
              })

              // Log the activity in database
              await prisma.activity.create({
                data: {
                  type: 'WHATSAPP_MESSAGE',
                  title: `WhatsApp message sent to ${lead.firstName} ${lead.lastName}`,
                  description: personalizedMessage,
                  status: 'COMPLETED',
                  priority: 'MEDIUM',
                  leadId: lead.id,
                  assignedToId: user.id,
                  createdById: user.id,
                },
              })
            }
          } catch (activityError) {
            console.error('Failed to log conversation/activity:', activityError)
            // Don't fail the whole operation if logging fails
          }
        } else {
          const errorData = await response.json()
          failedCount++
          results.push({
            leadId: lead.id,
            status: 'failed',
            error: errorData.message || 'Failed to send message',
            response: errorData
          })
        }
      } catch (error) {
        console.error(`Error sending message to lead ${lead.id}:`, error)
        failedCount++
        results.push({
          leadId: lead.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Create a summary activity for bulk messaging
    if (mode === 'bulk' && leads.length > 1) {
      try {
        await prisma.activity.create({
          data: {
            type: 'BULK_WHATSAPP',
            title: `Bulk WhatsApp campaign sent to ${leads.length} leads`,
            description: `Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"\n\nResults: ${successCount} successful, ${failedCount} failed`,
            status: 'COMPLETED',
            priority: 'MEDIUM',
            assignedToId: user.id,
            createdById: user.id,
          },
        })
      } catch (bulkActivityError) {
        console.error('Failed to log bulk activity:', bulkActivityError)
        // Don't fail the whole operation if activity logging fails
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      totalCount: leads.length,
      results,
      message: `Messages processed: ${successCount} sent successfully, ${failedCount} failed`
    })

  } catch (error) {
    console.error('WhatsApp messaging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
