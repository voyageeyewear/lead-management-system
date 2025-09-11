'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Info,
  Check,
  CheckCheck,
  Clock,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

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

interface ChatWindowProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (content: string, messageType?: string, templateName?: string) => void
  onToggleContactPanel: () => void
}

const quickTemplates = [
  { id: 'basic_welcome', name: 'Welcome', content: 'Hello {{name}}! Welcome to our optical services. How can we help you today?' },
  { id: 'simple_followup', name: 'Follow Up', content: 'Hi {{name}}! Following up on your optical needs. Any questions for us?' },
  { id: 'quick_reminder', name: 'Reminder', content: 'Hi {{name}}! Just a quick reminder about your appointment. See you soon!' }
]

export default function ChatWindow({ 
  conversation, 
  messages, 
  onSendMessage,
  onToggleContactPanel 
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    onSendMessage(newMessage)
    setNewMessage('')
  }

  const handleTemplateSelect = (template: typeof quickTemplates[0]) => {
    const personalizedContent = template.content.replace(
      '{{name}}', 
      `${conversation.lead.firstName} ${conversation.lead.lastName}`
    )
    onSendMessage(personalizedContent, 'template', template.id)
    setShowTemplates(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return ''
    }
  }

  const getDeliveryStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed':
        return <X className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={conversation.lead.avatar} 
              alt={`${conversation.lead.firstName} ${conversation.lead.lastName}`} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
              {getInitials(conversation.lead.firstName, conversation.lead.lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversation.lead.firstName} {conversation.lead.lastName}
            </h2>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">{conversation.lead.phone}</p>
              {conversation.isActive && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  WhatsApp Opted In
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleContactPanel}>
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-500 mb-4">Send a message to begin chatting with {conversation.lead.firstName}</p>
              <Button 
                onClick={() => setShowTemplates(true)}
                variant="outline"
              >
                Use Template
              </Button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.direction === 'outbound' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                  message.direction === 'outbound'
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <div className={cn(
                  "flex items-center justify-end space-x-1 mt-1",
                  message.direction === 'outbound' ? "text-blue-100" : "text-gray-400"
                )}>
                  <span className="text-xs">
                    {formatMessageTime(message.sentAt)}
                  </span>
                  {message.direction === 'outbound' && getDeliveryStatusIcon(message.deliveryStatus)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Templates */}
      {showTemplates && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Quick Templates</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowTemplates(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {quickTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto p-3"
                onClick={() => handleTemplateSelect(template)}
              >
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.content.replace('{{name}}', `${conversation.lead.firstName} ${conversation.lead.lastName}`)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 focus:ring-0 focus:border-0"
            />
          </div>
          
          <Button variant="ghost" size="icon">
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
