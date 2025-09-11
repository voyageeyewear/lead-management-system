'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getInitials } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  department?: string
  avatar?: string
  isActive: boolean
  createdAt: string
  _count: {
    assignedLeads: number
    opportunities: number
    activities: number
  }
  stats: {
    leadsThisMonth: number
    opportunitiesThisMonth: number
    revenue: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  const fetchUsers = async (page = 1, search = '', role = '', department = '') => {
    try {
      const token = localStorage.getItem('auth-token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(role && { role }),
        ...(department && { department }),
      })

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.pages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser && ['ADMIN', 'SALES_MANAGER'].includes(currentUser.role)) {
      fetchUsers()
    } else {
      setIsLoading(false)
    }
  }, [currentUser])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers(1, searchTerm, selectedRole, selectedDepartment)
  }

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800',
      SALES_MANAGER: 'bg-purple-100 text-purple-800',
      SALES_REP: 'bg-blue-100 text-blue-800',
      MARKETING: 'bg-green-100 text-green-800',
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  // Calculate team stats
  const totalRevenue = users.reduce((sum, user) => sum + user.stats.revenue, 0)
  const totalLeads = users.reduce((sum, user) => sum + user.stats.leadsThisMonth, 0)
  const totalOpportunities = users.reduce((sum, user) => sum + user.stats.opportunitiesThisMonth, 0)
  const activeUsers = users.filter(user => user.isActive).length

  if (!currentUser || !['ADMIN', 'SALES_MANAGER'].includes(currentUser.role)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <div className="text-center py-8">
          <p className="text-gray-500">You don't have permission to view team information</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
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
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Manage your sales team and track performance</p>
        </div>
        {currentUser.role === 'ADMIN' && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeUsers}</div>
            <p className="text-xs text-gray-500">
              {users.length} total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalLeads}</div>
            <p className="text-xs text-gray-500">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Opportunities
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalOpportunities}</div>
            <p className="text-xs text-gray-500">
              This month
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
                  placeholder="Search team members by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value)
                  fetchUsers(1, searchTerm, e.target.value, selectedDepartment)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="SALES_REP">Sales Rep</option>
                <option value="MARKETING">Marketing</option>
              </select>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  fetchUsers(1, searchTerm, selectedRole, e.target.value)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Departments</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Management">Management</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No team members found</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-12 w-12 rounded-full"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {getInitials(user.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      )}
                      {user.department && (
                        <p className="text-xs text-gray-400">{user.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(user.stats.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {user.stats.leadsThisMonth}
                      </div>
                      <div className="text-xs text-gray-500">Leads</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {user.stats.opportunitiesThisMonth}
                      </div>
                      <div className="text-xs text-gray-500">Opportunities</div>
                    </div>

                    <div className="text-right">
                      <div className="flex space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {user._count.assignedLeads} assigned leads
                      </div>
                      <div className="text-xs text-gray-400">
                        {user._count.activities} activities
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {currentUser.role === 'ADMIN' && (
                        <>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
                onClick={() => fetchUsers(currentPage - 1, searchTerm, selectedRole, selectedDepartment)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => fetchUsers(currentPage + 1, searchTerm, selectedRole, selectedDepartment)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
