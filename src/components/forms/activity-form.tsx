'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityFormProps {
  activity?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function ActivityForm({ activity, onSubmit, onCancel }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    type: 'TASK',
    title: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '',
    leadId: '',
    opportunityId: '',
    assignedToId: '',
  })
  const [leads, setLeads] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (activity) {
      setFormData({
        type: activity.type || 'TASK',
        title: activity.title || '',
        description: activity.description || '',
        status: activity.status || 'PENDING',
        priority: activity.priority || 'MEDIUM',
        dueDate: activity.dueDate ? activity.dueDate.split('T')[0] : '',
        leadId: activity.leadId || '',
        opportunityId: activity.opportunityId || '',
        assignedToId: activity.assignedToId || '',
      })
    }
    fetchLeads()
    fetchOpportunities()
    fetchUsers()
  }, [activity])

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

  const fetchOpportunities = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/opportunities?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunities)
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
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
        dueDate: formData.dueDate || null,
        leadId: formData.leadId || null,
        opportunityId: formData.opportunityId || null,
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
          {activity ? 'Edit Activity' : 'Add New Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="TASK">Task</option>
                <option value="NOTE">Note</option>
                <option value="FOLLOW_UP">Follow Up</option>
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
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="leadId">Related Lead</Label>
              <select
                id="leadId"
                name="leadId"
                value={formData.leadId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Lead (Optional)</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.firstName} {lead.lastName} - {lead.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="opportunityId">Related Opportunity</Label>
              <select
                id="opportunityId"
                name="opportunityId"
                value={formData.opportunityId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Opportunity (Optional)</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.title} - ₹{opportunity.value?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
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
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Activity title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Activity description..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (activity ? 'Update' : 'Create')} Activity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
