'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OpportunityFormProps {
  opportunity?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function OpportunityForm({ opportunity, onSubmit, onCancel }: OpportunityFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    probability: '',
    stage: 'QUALIFICATION',
    status: 'OPEN',
    closeDate: '',
    leadId: '',
    assignedToId: '',
  })
  const [leads, setLeads] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (opportunity) {
      setFormData({
        title: opportunity.title || '',
        description: opportunity.description || '',
        value: opportunity.value?.toString() || '',
        probability: opportunity.probability?.toString() || '',
        stage: opportunity.stage || 'QUALIFICATION',
        status: opportunity.status || 'OPEN',
        closeDate: opportunity.closeDate ? opportunity.closeDate.split('T')[0] : '',
        leadId: opportunity.leadId || '',
        assignedToId: opportunity.assignedToId || '',
      })
    }
    fetchLeads()
    fetchUsers()
  }, [opportunity])

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/leads?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/users?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const submitData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability) || 0,
        closeDate: formData.closeDate || null,
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>
          {opportunity ? 'Edit Opportunity' : 'Add New Opportunity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Opportunity title"
              />
            </div>

            <div>
              <Label htmlFor="value">Value (INR) *</Label>
              <Input
                id="value"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                required
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="probability">Probability (%) *</Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                value={formData.probability}
                onChange={handleChange}
                required
                placeholder="0"
                min="0"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="stage">Stage *</Label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="QUALIFICATION">Qualification</option>
                <option value="NEEDS_ANALYSIS">Needs Analysis</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OPEN">Open</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div>
              <Label htmlFor="closeDate">Expected Close Date</Label>
              <Input
                id="closeDate"
                name="closeDate"
                type="date"
                value={formData.closeDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="leadId">Lead *</Label>
              <select
                id="leadId"
                name="leadId"
                value={formData.leadId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName} - {lead.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="assignedToId">Assigned To *</Label>
              <select
                id="assignedToId"
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Opportunity description..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (opportunity ? 'Update' : 'Create')} Opportunity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
