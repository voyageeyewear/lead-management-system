'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Phone, 
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Settings
} from 'lucide-react'
import ChatList from '@/components/inbox/chat-list'
import ChatWindow from '@/components/inbox/chat-window'
import ContactPanel from '@/components/inbox/contact-panel'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  avatar?: string
}

interface Message {
  id: string
  content: string
  direction: 'inbound' | 'outbound'
  sentAt: string
  deliveryStatus?: string
  sender?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface Conversation {
  id: string
  lead: Lead
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  lastMessage: string
  lastMessageAt: string
  lastMessageDirection: 'inbound' | 'outbound'
  unreadCount: number
  isActive: boolean
  deliveryStatus?: string
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showContactPanel, setShowContactPanel] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
    
    // Mark as read (reset unread count)
    if (conversation.unreadCount > 0) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      )
    }
  }

  const handleSendMessage = async (content: string, messageType: string = 'text', templateName?: string) => {
    if (!selectedConversation) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          messageType,
          templateName
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        
        // Update conversation last message
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: content,
                  lastMessageAt: new Date().toISOString(),
                  lastMessageDirection: 'outbound'
                }
              : conv
          )
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    `${conv.lead.firstName} ${conv.lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lead.phone.includes(searchTerm)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left Panel - Chat List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ChatList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
        />
      </div>

      {/* Center Panel - Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onToggleContactPanel={() => setShowContactPanel(!showContactPanel)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Contact Details */}
      {showContactPanel && selectedConversation && (
        <ContactPanel
          conversation={selectedConversation}
          onClose={() => setShowContactPanel(false)}
        />
      )}
    </div>
  )
}
