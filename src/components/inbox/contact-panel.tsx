'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  X, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  Calendar,
  Edit,
  Plus,
  Tag,
  FileText,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface ContactPanelProps {
  conversation: Conversation
  onClose: () => void
}

export default function ContactPanel({ conversation, onClose }: ContactPanelProps) {
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState(['Curious Browsers', 'Order Placed(CoD)'])
  const [notes, setNotes] = useState<string[]>([])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes(prev => [...prev, newNote.trim()])
      setNewNote('')
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Contact Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Contact Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={conversation.lead.avatar} 
                alt={`${conversation.lead.firstName} ${conversation.lead.lastName}`} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-lg">
                {getInitials(conversation.lead.firstName, conversation.lead.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {conversation.lead.firstName} {conversation.lead.lastName}
              </h3>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact:</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{conversation.lead.phone}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email:</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{conversation.lead.email}</span>
              </div>
            </div>

            {conversation.lead.company && (
              <div>
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{conversation.lead.company}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">WhatsApp Opted:</Label>
              <div className="mt-1">
                <Badge 
                  variant={conversation.isActive ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    conversation.isActive 
                      ? "bg-green-100 text-green-700 hover:bg-green-200" 
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  {conversation.isActive ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</Label>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {/* Existing Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer group"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            </div>
            
            {/* Add New Tag */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                className="text-xs h-8"
              />
              <Button 
                size="sm" 
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="h-8 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Show More Section */}
        <div className="p-4 border-b border-gray-200">
          <Button variant="ghost" className="w-full justify-start text-sm text-gray-600 hover:text-gray-900">
            Show More
            <span className="ml-auto">→</span>
          </Button>
        </div>

        {/* Notes */}
        <div className="p-4">
          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">Notes</Label>
          
          {/* Existing Notes */}
          {notes.length > 0 && (
            <div className="space-y-2 mb-4">
              {notes.map((note, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">{note}</p>
                  <p className="text-xs text-gray-500 mt-1">Just now</p>
                </div>
              ))}
            </div>
          )}
          
          {/* No Notes Message */}
          {notes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-4">No Notes available</p>
            </div>
          )}
          
          {/* Add New Note */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add your note here"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="text-sm min-h-[80px] resize-none"
              maxLength={400}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {newNote.length}/400
              </span>
              <Button 
                size="sm" 
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                ADD
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
