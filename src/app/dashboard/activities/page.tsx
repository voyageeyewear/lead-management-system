'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, Clock, User, MessageSquare, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'
import ActivityForm from '@/components/forms/activity-form'
import WhatsAppMessaging from '@/components/messaging/whatsapp-messaging'

interface Activity {
  id: string
  type: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  completedAt?: string
  createdAt: string
  lead?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
  }
  opportunity?: {
    id: string
    title: string
    value: number
  }
  assignedTo: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface ActivitiesResponse {
  activities: Activity[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showWhatsAppMessaging, setShowWhatsAppMessaging] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<any[]>([])

  const fetchActivities = async (page = 1, search = '', type = '', status = '') => {
    try {
      const token = localStorage.getItem('auth-token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...(search && { search }),
        ...(type && { type }),
        ...(status && { status }),
      })

      const response = await fetch(`/api/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: ActivitiesResponse = await response.json()
        setActivities(data.activities)
        setTotalPages(data.pagination.pages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchActivities(1, searchTerm, selectedType, selectedStatus)
  }

  const handleAddActivity = () => {
    setSelectedActivity(null)
    setShowActivityForm(true)
  }

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowActivityForm(true)
  }

  const handleViewActivity = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId)
    if (activity) {
      alert(`Activity: ${activity.title}\nType: ${activity.type}\nStatus: ${activity.status}\nDescription: ${activity.description || 'No description'}`)
    }
  }

  const handleDeleteActivity = async (activityId: string, activityTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${activityTitle}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchActivities(currentPage, searchTerm, selectedType, selectedStatus)
        alert('Activity deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete activity')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('An error occurred while deleting the activity')
    }
  }

  const handleActivitySubmit = async (activityData: any) => {
    try {
      const token = localStorage.getItem('auth-token')
      const url = selectedActivity ? `/api/activities/${selectedActivity.id}` : '/api/activities'
      const method = selectedActivity ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
      })

      if (response.ok) {
        setShowActivityForm(false)
        setSelectedActivity(null)
        fetchActivities(currentPage, searchTerm, selectedType, selectedStatus)
        alert(selectedActivity ? 'Activity updated successfully' : 'Activity created successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save activity')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving the activity')
    }
  }

  const handleWhatsAppMessage = (leads: any[]) => {
    setSelectedLeads(leads)
    setShowWhatsAppMessaging(true)
  }

  const getTypeColor = (type: string) => {
    const colors = {
      CALL: 'bg-blue-100 text-blue-800',
      EMAIL: 'bg-green-100 text-green-800',
      MEETING: 'bg-purple-100 text-purple-800',
      TASK: 'bg-yellow-100 text-yellow-800',
      NOTE: 'bg-gray-100 text-gray-800',
      FOLLOW_UP: 'bg-orange-100 text-orange-800',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  // Calculate summary stats
  const totalActivities = activities.length
  const completedActivities = activities.filter(activity => activity.status === 'COMPLETED').length
  const pendingActivities = activities.filter(activity => activity.status === 'PENDING').length
  const overdueActivities = activities.filter(activity => 
    activity.status !== 'COMPLETED' && 
    activity.dueDate && 
    new Date(activity.dueDate) < new Date()
  ).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleAddActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600">Manage your tasks, calls, meetings, and follow-ups</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleWhatsAppMessage(activities.filter(a => a.lead?.phone).map(a => a.lead))}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp Messaging
          </Button>
          <Button onClick={handleAddActivity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Activities
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalActivities}</div>
            <p className="text-xs text-gray-500">All activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{completedActivities}</div>
            <p className="text-xs text-gray-500">Finished tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingActivities}</div>
            <p className="text-xs text-gray-500">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue
            </CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overdueActivities}</div>
            <p className="text-xs text-gray-500">Past due date</p>
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
                  placeholder="Search activities by title, lead, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value)
                  fetchActivities(1, searchTerm, e.target.value, selectedStatus)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="TASK">Task</option>
                <option value="NOTE">Note</option>
                <option value="FOLLOW_UP">Follow Up</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  fetchActivities(1, searchTerm, selectedType, e.target.value)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No activities found</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activity.lead && `${activity.lead.firstName} ${activity.lead.lastName}`}
                        {activity.lead?.company && ` • ${activity.lead.company}`}
                        {activity.opportunity && ` • ${activity.opportunity.title}`}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>👤 {activity.assignedTo.name}</span>
                        {activity.dueDate && (
                          <span>📅 Due: {formatDate(activity.dueDate)}</span>
                        )}
                        <span>📝 Created: {formatDate(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(activity.type)}`}>
                          {activity.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className={`text-sm font-medium ${getPriorityColor(activity.priority)}`}>
                        {activity.priority} Priority
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewActivity(activity.id)}
                        title="View Activity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditActivity(activity)}
                        title="Edit Activity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {activity.lead?.phone && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleWhatsAppMessage([activity.lead])}
                          title="Send WhatsApp Message"
                          className="text-green-600 hover:text-green-700"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteActivity(activity.id, activity.title)}
                        title="Delete Activity"
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
                onClick={() => fetchActivities(currentPage - 1, searchTerm, selectedType, selectedStatus)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => fetchActivities(currentPage + 1, searchTerm, selectedType, selectedStatus)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ActivityForm
            activity={selectedActivity}
            onSubmit={handleActivitySubmit}
            onCancel={() => {
              setShowActivityForm(false)
              setSelectedActivity(null)
            }}
          />
        </div>
      )}

      {/* WhatsApp Messaging Modal */}
      {showWhatsAppMessaging && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <WhatsAppMessaging
            leads={selectedLeads}
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
