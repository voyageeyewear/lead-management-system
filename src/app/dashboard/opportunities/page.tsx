'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import OpportunityForm from '@/components/forms/opportunity-form'

interface Opportunity {
  id: string
  title: string
  description?: string
  value: number
  probability: number
  stage: string
  status: string
  closeDate?: string
  createdAt: string
  lead: {
    id: string
    firstName: string
    lastName: string
    email: string
    company?: string
  }
  assignedTo: {
    id: string
    name: string
    email: string
  }
  _count: {
    activities: number
    notes: number
  }
}

interface OpportunitiesResponse {
  opportunities: Opportunity[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showOpportunityForm, setShowOpportunityForm] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  const fetchOpportunities = async (page = 1, search = '', stage = '', status = '') => {
    try {
      const token = localStorage.getItem('auth-token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...(search && { search }),
        ...(stage && { stage }),
        ...(status && { status }),
      })

      const response = await fetch(`/api/opportunities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: OpportunitiesResponse = await response.json()
        setOpportunities(data.opportunities)
        setTotalPages(data.pagination.pages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOpportunities(1, searchTerm, selectedStage, selectedStatus)
  }

  const handleAddOpportunity = () => {
    setSelectedOpportunity(null)
    setShowOpportunityForm(true)
  }

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity)
    setShowOpportunityForm(true)
  }

  const handleViewOpportunity = (opportunityId: string) => {
    // For now, just show an alert. In a full implementation, this would navigate to a detail page
    alert(`View opportunity details for ID: ${opportunityId}`)
  }

  const handleDeleteOpportunity = async (opportunityId: string, opportunityTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${opportunityTitle}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchOpportunities(currentPage, searchTerm, selectedStage, selectedStatus)
        alert('Opportunity deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete opportunity')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('An error occurred while deleting the opportunity')
    }
  }

  const handleOpportunitySubmit = async (opportunityData: any) => {
    try {
      const token = localStorage.getItem('auth-token')
      const url = selectedOpportunity ? `/api/opportunities/${selectedOpportunity.id}` : '/api/opportunities'
      const method = selectedOpportunity ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(opportunityData),
      })

      if (response.ok) {
        setShowOpportunityForm(false)
        setSelectedOpportunity(null)
        fetchOpportunities(currentPage, searchTerm, selectedStage, selectedStatus)
        alert(selectedOpportunity ? 'Opportunity updated successfully' : 'Opportunity created successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save opportunity')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving the opportunity')
    }
  }

  const getStageColor = (stage: string) => {
    const colors = {
      QUALIFICATION: 'bg-blue-100 text-blue-800',
      NEEDS_ANALYSIS: 'bg-yellow-100 text-yellow-800',
      PROPOSAL: 'bg-purple-100 text-purple-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-red-100 text-red-800',
    }
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-blue-100 text-blue-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600'
    if (probability >= 60) return 'text-yellow-600'
    if (probability >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  // Calculate summary stats
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0)
  const avgProbability = opportunities.length > 0 
    ? Math.round(opportunities.reduce((sum, opp) => sum + opp.probability, 0) / opportunities.length)
    : 0
  const openOpportunities = opportunities.filter(opp => opp.status === 'OPEN').length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <Button onClick={handleAddOpportunity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Opportunity
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
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600">Manage your sales pipeline and opportunities</p>
        </div>
        <Button onClick={handleAddOpportunity}>
          <Plus className="h-4 w-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pipeline Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-gray-500">
              {opportunities.length} opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Probability
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{avgProbability}%</div>
            <p className="text-xs text-gray-500">
              Weighted average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Opportunities
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{openOpportunities}</div>
            <p className="text-xs text-gray-500">
              Active deals
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search opportunities by title, lead, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value)
                  fetchOpportunities(1, searchTerm, e.target.value, selectedStatus)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Stages</option>
                <option value="QUALIFICATION">Qualification</option>
                <option value="NEEDS_ANALYSIS">Needs Analysis</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  fetchOpportunities(1, searchTerm, selectedStage, e.target.value)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No opportunities found</p>
              </div>
            ) : (
              opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {opportunity.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {opportunity.lead.firstName} {opportunity.lead.lastName}
                        {opportunity.lead.company && ` • ${opportunity.lead.company}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        Assigned to {opportunity.assignedTo.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(opportunity.value)}
                      </div>
                      <div className={`text-sm font-medium ${getProbabilityColor(opportunity.probability)}`}>
                        {opportunity.probability}% probability
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(opportunity.stage)}`}>
                          {opportunity.stage.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(opportunity.status)}`}>
                          {opportunity.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {opportunity.closeDate && `Close: ${formatDate(opportunity.closeDate)}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {opportunity._count.activities} activities • {opportunity._count.notes} notes
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewOpportunity(opportunity.id)}
                        title="View Opportunity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditOpportunity(opportunity)}
                        title="Edit Opportunity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteOpportunity(opportunity.id, opportunity.title)}
                        title="Delete Opportunity"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => fetchOpportunities(currentPage - 1, searchTerm, selectedStage, selectedStatus)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => fetchOpportunities(currentPage + 1, searchTerm, selectedStage, selectedStatus)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opportunity Form Modal */}
      {showOpportunityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <OpportunityForm
            opportunity={selectedOpportunity}
            onSubmit={handleOpportunitySubmit}
            onCancel={() => {
              setShowOpportunityForm(false)
              setSelectedOpportunity(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
