'use client'

import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock } from 'lucide-react'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  avatar?: string
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

interface ChatListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onConversationSelect: (conversation: Conversation) => void
}

export default function ChatList({ 
  conversations, 
  selectedConversation, 
  onConversationSelect 
}: ChatListProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      } else if (diffInHours < 168) { // 7 days
        return formatDistanceToNow(date, { addSuffix: false })
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    } catch {
      return ''
    }
  }

  const getDeliveryStatusIcon = (status?: string, direction?: string) => {
    if (direction !== 'outbound') return null
    
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed':
        return <Clock className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-gray-400 text-xl">💬</span>
          </div>
          <p className="text-gray-500 text-sm">No conversations yet</p>
          <p className="text-gray-400 text-xs mt-1">Start messaging your leads to see conversations here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors",
            selectedConversation?.id === conversation.id && "bg-blue-50 border-blue-200"
          )}
          onClick={() => onConversationSelect(conversation)}
        >
          {/* Avatar */}
          <div className="relative mr-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={conversation.lead.avatar} 
                alt={`${conversation.lead.firstName} ${conversation.lead.lastName}`} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                {getInitials(conversation.lead.firstName, conversation.lead.lastName)}
              </AvatarFallback>
            </Avatar>
            
            {/* Online status indicator */}
            {conversation.isActive && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {conversation.lead.firstName} {conversation.lead.lastName}
              </h3>
              <div className="flex items-center space-x-1">
                {getDeliveryStatusIcon(conversation.deliveryStatus, conversation.lastMessageDirection)}
                <span className="text-xs text-gray-500">
                  {formatTime(conversation.lastMessageAt)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  {conversation.lastMessage === 'No messages yet' ? (
                    <span className="italic text-gray-400">No messages yet</span>
                  ) : (
                    <>
                      {conversation.lastMessageDirection === 'outbound' && (
                        <span className="text-gray-400 mr-1">You:</span>
                      )}
                      {truncateMessage(conversation.lastMessage)}
                    </>
                  )}
                </p>
                
                {/* Company name */}
                {conversation.lead.company && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {conversation.lead.company}
                  </p>
                )}
              </div>
              
              {/* Unread count */}
              {conversation.unreadCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center"
                >
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
