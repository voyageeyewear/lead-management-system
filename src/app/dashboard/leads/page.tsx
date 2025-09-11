'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Upload, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CSVUpload from '@/components/forms/csv-upload'
import LeadForm from '@/components/forms/lead-form'
import WhatsAppMessaging from '@/components/messaging/whatsapp-messaging'

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
  createdAt: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    opportunities: number
    activities: number
    notes: number
  }
}

interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkAssignee, setBulkAssignee] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [showWhatsAppMessaging, setShowWhatsAppMessaging] = useState(false)

  const fetchLeads = async (page = 1, search = '') => {
    try {
      const token = localStorage.getItem('auth-token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...(search && { search }),
      })

      const response = await fetch(`/api/leads?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: LeadsResponse = await response.json()
        setLeads(data.leads)
        setTotalPages(data.pagination.pages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setIsLoading(false)
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

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
    fetchLeads()
    fetchUsers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLeads(1, searchTerm)
  }

  const handleAddLead = () => {
    setSelectedLead(null)
    setShowLeadForm(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowLeadForm(true)
  }

  const handleViewLead = (leadId: string) => {
    window.open(`/dashboard/leads/${leadId}`, '_blank')
  }

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Are you sure you want to delete ${leadName}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchLeads(currentPage, searchTerm)
        alert('Lead deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete lead')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('An error occurred while deleting the lead')
    }
  }

  const handleLeadSubmit = async (leadData: any) => {
    try {
      const token = localStorage.getItem('auth-token')
      const url = selectedLead ? `/api/leads/${selectedLead.id}` : '/api/leads'
      const method = selectedLead ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(leadData),
      })

      if (response.ok) {
        setShowLeadForm(false)
        setSelectedLead(null)
        fetchLeads(currentPage, searchTerm)
        alert(selectedLead ? 'Lead updated successfully' : 'Lead created successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save lead')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving the lead')
    }
  }

  const handleSelectLead = (leadId: string) => {
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

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0 || !bulkAssignee) {
      alert('Please select leads and an assignee')
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'assign',
          leadIds: selectedLeads,
          data: { assignedToId: bulkAssignee }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        setSelectedLeads([])
        setShowBulkActions(false)
        setBulkAssignee('')
        fetchLeads(currentPage, searchTerm)
      } else {
        const error = await response.json()
        alert(error.error || 'Bulk assignment failed')
      }
    } catch (error) {
      console.error('Bulk assign error:', error)
      alert('An error occurred during bulk assignment')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/leads/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ leadIds: selectedLeads }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        setSelectedLeads([])
        setShowBulkActions(false)
        fetchLeads(currentPage, searchTerm)
      } else {
        const error = await response.json()
        alert(error.error || 'Bulk deletion failed')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('An error occurred during bulk deletion')
    }
  }

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage and track your sales leads</p>
        </div>
        <div className="flex space-x-2">
          {currentUser && ['ADMIN', 'SALES_MANAGER'].includes(currentUser.role) && (
            <Button variant="outline" onClick={() => setShowCSVUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          )}
          <Button onClick={handleAddLead}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLeads([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {!showBulkActions ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkActions(true)}
                  >
                    Bulk Actions
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <select
                      value={bulkAssignee}
                      onChange={(e) => setBulkAssignee(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select Assignee</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={handleBulkAssign}>
                      Assign
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id) && lead.phone)
                        if (selectedLeadData.length === 0) {
                          alert('No selected leads have phone numbers')
                          return
                        }
                        setShowWhatsAppMessaging(true)
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    {currentUser && ['ADMIN', 'SALES_MANAGER'].includes(currentUser.role) && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={handleBulkDelete}
                      >
                        Delete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkActions(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No leads found</p>
              </div>
            ) : (
              <>
                {/* Select All Header */}
                {currentUser && ['ADMIN', 'SALES_MANAGER'].includes(currentUser.role) && (
                  <div className="flex items-center space-x-3 p-3 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      Select All ({leads.length} leads on this page)
                    </span>
                  </div>
                )}
                
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                      selectedLeads.includes(lead.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {currentUser && ['ADMIN', 'SALES_MANAGER'].includes(currentUser.role) && (
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded"
                        />
                      )}
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                         <div className="flex items-center space-x-4 text-sm text-gray-500">
                           {lead.phone && (
                             <span>📞 {lead.phone}</span>
                           )}
                           {lead.company && (
                             <span>🏢 {lead.company}</span>
                           )}
                           {lead.description && lead.description.includes('Location:') && (
                             <span>📍 {lead.description.replace('Location: ', '')}</span>
                           )}
                         </div>
                         {lead.assignedTo && (
                           <div className="text-xs text-blue-600 mt-1">
                             👤 Assigned to: {lead.assignedTo.name}
                           </div>
                         )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(lead.source)}`}>
                            {lead.source.replace('_', ' ')}
                          </span>
                        </div>
                         <div className="text-sm text-gray-500">
                           Score: {lead.score}/100
                           {lead.value && ` • ₹${lead.value.toLocaleString()}`}
                         </div>
                        <div className="text-xs text-gray-400">
                          {lead._count.opportunities} opp • {lead._count.activities} activities
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewLead(lead.id)}
                          title="View Lead"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditLead(lead)}
                          title="Edit Lead"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {lead.phone && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedLeads([lead.id])
                              setShowWhatsAppMessaging(true)
                            }}
                            title="Send WhatsApp Message"
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteLead(lead.id, `${lead.firstName} ${lead.lastName}`)}
                          title="Delete Lead"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => fetchLeads(currentPage - 1, searchTerm)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => fetchLeads(currentPage + 1, searchTerm)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <CSVUpload
          onClose={() => setShowCSVUpload(false)}
          onSuccess={() => {
            fetchLeads() // Refresh the leads list
          }}
        />
      )}

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LeadForm
            lead={selectedLead}
            onSubmit={handleLeadSubmit}
            onCancel={() => {
              setShowLeadForm(false)
              setSelectedLead(null)
            }}
          />
        </div>
      )}

      {/* WhatsApp Messaging Modal */}
      {showWhatsAppMessaging && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <WhatsAppMessaging
            leads={leads.filter(lead => selectedLeads.includes(lead.id) && lead.phone)}
            onClose={() => {
              setShowWhatsAppMessaging(false)
              setSelectedLeads([])
            }}
          />
        </div>
      )}
    </div>
  )
}
