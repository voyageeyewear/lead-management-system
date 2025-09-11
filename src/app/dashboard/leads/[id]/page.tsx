'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Phone, Mail, Building, MapPin, Calendar, User, Target, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
  source: string
  status: string
  score: number
  value?: number
  description?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  lastContactedAt?: string
  assignedTo?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  opportunities: Array<{
    id: string
    title: string
    value: number
    stage: string
    status: string
    probability: number
  }>
  activities: Array<{
    id: string
    type: string
    subject: string
    status: string
    createdAt: string
    assignedTo: {
      name: string
    }
  }>
  notes: Array<{
    id: string
    content: string
    createdAt: string
    author: {
      name: string
    }
  }>
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch(`/api/leads/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const leadData = await response.json()
          setLead(leadData)
        } else {
          console.error('Failed to fetch lead')
          router.push('/dashboard/leads')
        }
      } catch (error) {
        console.error('Error fetching lead:', error)
        router.push('/dashboard/leads')
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchLead()
    }
  }, [params.id, router])

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      PROPOSAL: 'bg-purple-100 text-purple-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-red-100 text-red-800',
      UNQUALIFIED: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getSourceColor = (source: string) => {
    const colors = {
      WEBSITE: 'bg-blue-100 text-blue-800',
      EMAIL: 'bg-green-100 text-green-800',
      PHONE: 'bg-yellow-100 text-yellow-800',
      REFERRAL: 'bg-purple-100 text-purple-800',
      SOCIAL_MEDIA: 'bg-pink-100 text-pink-800',
      ADVERTISEMENT: 'bg-red-100 text-red-800',
      EVENT: 'bg-indigo-100 text-indigo-800',
      COLD_CALL: 'bg-gray-100 text-gray-800',
      CSV_IMPORT: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800',
    }
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Lead Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-gray-600">{lead.company && `${lead.company} • `}{lead.jobTitle}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
                {lead.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{lead.company}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="font-medium">{lead.score}/100</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(lead.status)}`}>
                  {lead.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSourceColor(lead.source)}`}>
                  {lead.source.replace('_', ' ')}
                </span>
                {lead.value && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                    {formatCurrency(lead.value)}
                  </span>
                )}
              </div>

              {lead.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{lead.description}</p>
                </div>
              )}

              {lead.tags && lead.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          {lead.opportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Opportunities ({lead.opportunities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lead.opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{opportunity.title}</h4>
                        <p className="text-sm text-gray-500">
                          {opportunity.stage} • {opportunity.probability}% probability
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(opportunity.value)}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          opportunity.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                          opportunity.status === 'WON' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {opportunity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities ({lead.activities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activities yet</p>
              ) : (
                <div className="space-y-3">
                  {lead.activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.subject}</h4>
                        <p className="text-sm text-gray-500">
                          {activity.type} • {activity.assignedTo.name} • {formatDate(activity.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        activity.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{lead.assignedTo?.name || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium">{lead.createdBy.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(lead.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(lead.updatedAt)}</p>
                </div>
              </div>
              {lead.lastContactedAt && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Last Contacted</p>
                    <p className="font-medium">{formatDate(lead.lastContactedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes ({lead.notes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {lead.notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {note.author.name} • {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
