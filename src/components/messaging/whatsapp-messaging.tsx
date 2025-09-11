'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Send, Users, User, X } from 'lucide-react'

interface WhatsAppMessagingProps {
  leads: any[]
  onClose: () => void
}

export default function WhatsAppMessaging({ leads, onClose }: WhatsAppMessagingProps) {
  const [message, setMessage] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [messageType, setMessageType] = useState('template')
  const [templateName, setTemplateName] = useState('basic_welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [messagingMode, setMessagingMode] = useState<'individual' | 'bulk'>('individual')
  const [templates, setTemplates] = useState([
    { id: 'basic_welcome', name: 'Basic Welcome', content: 'Hello {{name}}! Welcome to our optical services. How can we help you today?' },
    { id: 'simple_followup', name: 'Simple Follow Up', content: 'Hi {{name}}! Following up on your optical needs. Any questions for us?' },
    { id: 'quick_reminder', name: 'Quick Reminder', content: 'Hi {{name}}! Just a quick reminder about your appointment. See you soon!' },
  ])

  useEffect(() => {
    if (leads.length === 1) {
      setMessagingMode('individual')
      setSelectedLeads([leads[0].id])
    } else {
      setMessagingMode('bulk')
      setSelectedLeads(leads.map(lead => lead.id))
    }
  }, [leads])

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
    }
  }

  const handleTemplateSelect = (template: any) => {
    setMessage(template.content)
    setTemplateName(template.name)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || selectedLeads.length === 0) {
      alert('Please enter a message and select at least one lead')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('auth-token')
      const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id))

      const response = await fetch('/api/messaging/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leads: selectedLeadData,
          message,
          messageType,
          templateName,
          mode: messagingMode,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Messages sent successfully! ${result.successCount} sent, ${result.failedCount} failed.`)
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send messages')
      }
    } catch (error) {
      console.error('Send message error:', error)
      alert('An error occurred while sending messages')
    } finally {
      setIsLoading(false)
    }
  }

  const previewMessage = (lead: any) => {
    return message.replace(/\{\{name\}\}/g, `${lead.firstName} ${lead.lastName}`)
      .replace(/\{\{company\}\}/g, lead.company || 'your company')
      .replace(/\{\{phone\}\}/g, lead.phone || 'your phone')
  }

  return (
    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <CardTitle>WhatsApp Messaging</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Messaging Mode */}
        <div>
          <Label>Messaging Mode</Label>
          <div className="flex space-x-4 mt-2">
            <Button
              variant={messagingMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessagingMode('individual')}
            >
              <User className="h-4 w-4 mr-2" />
              Individual
            </Button>
            <Button
              variant={messagingMode === 'bulk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessagingMode('bulk')}
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Messaging
            </Button>
          </div>
        </div>

        {/* Lead Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Select Recipients ({selectedLeads.length} selected)</Label>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={() => handleLeadSelection(lead.id)}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    📞 {lead.phone} • {lead.email}
                    {lead.company && ` • ${lead.company}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Templates */}
        <div>
          <Label>Quick Templates</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className="justify-start text-left"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Type */}
        <div>
          <Label htmlFor="messageType">Message Type</Label>
          <select
            id="messageType"
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
          >
            <option value="text">Text Message</option>
            <option value="template">Template Message</option>
          </select>
        </div>

        {/* Message Content */}
        <div>
          <Label htmlFor="message">Message Content</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
            placeholder="Enter your message here... Use {{name}}, {{company}}, {{phone}} for personalization"
          />
          <p className="text-xs text-gray-500 mt-1">
            Available variables: {'{'}name{'}'}, {'{'}company{'}'}, {'{'}phone{'}'}
          </p>
        </div>

        {/* Message Preview */}
        {message && selectedLeads.length > 0 && (
          <div>
            <Label>Message Preview</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium mb-2">Preview for first selected lead:</p>
              <div className="bg-white p-3 rounded border-l-4 border-green-500">
                <p className="text-sm">
                  {previewMessage(leads.find(lead => selectedLeads.includes(lead.id)))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !message.trim() || selectedLeads.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedLeads.length} recipient{selectedLeads.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
