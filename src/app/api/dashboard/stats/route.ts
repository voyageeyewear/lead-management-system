import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Build where clause based on user role
    const userFilter = ['ADMIN', 'SALES_MANAGER'].includes(user.role) 
      ? {} 
      : { assignedToId: user.id }

    // Get basic counts
    const [
      totalLeads,
      newLeadsThisWeek,
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      activitiesThisWeek,
      revenueThisMonth,
      revenueThisYear,
    ] = await Promise.all([
      // Total leads
      prisma.lead.count({
        where: userFilter,
      }),
      
      // New leads this week
      prisma.lead.count({
        where: {
          ...userFilter,
          createdAt: { gte: startOfWeek },
        },
      }),
      
      // Total opportunities
      prisma.opportunity.count({
        where: userFilter,
      }),
      
      // Open opportunities
      prisma.opportunity.count({
        where: {
          ...userFilter,
          status: 'OPEN',
        },
      }),
      
      // Won opportunities
      prisma.opportunity.count({
        where: {
          ...userFilter,
          status: 'WON',
        },
      }),
      
      // Activities this week
      prisma.activity.count({
        where: {
          ...userFilter,
          createdAt: { gte: startOfWeek },
        },
      }),
      
      // Revenue this month
      prisma.opportunity.aggregate({
        where: {
          ...userFilter,
          status: 'WON',
          updatedAt: { gte: startOfMonth },
        },
        _sum: { value: true },
      }),
      
      // Revenue this year
      prisma.opportunity.aggregate({
        where: {
          ...userFilter,
          status: 'WON',
          updatedAt: { gte: startOfYear },
        },
        _sum: { value: true },
      }),
    ])

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 
      ? Math.round((totalOpportunities / totalLeads) * 100 * 10) / 10
      : 0

    // Get lead sources breakdown
    const leadSources = await prisma.lead.groupBy({
      by: ['source'],
      where: userFilter,
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    })

    // Get lead status breakdown
    const leadStatuses = await prisma.lead.groupBy({
      by: ['status'],
      where: userFilter,
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
    })

    // Get opportunity stages breakdown
    const opportunityStages = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: {
        ...userFilter,
        status: 'OPEN',
      },
      _count: { stage: true },
      _sum: { value: true },
      orderBy: { _count: { stage: 'desc' } },
    })

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      where: userFilter,
      include: {
        lead: {
          select: { firstName: true, lastName: true, company: true }
        },
        opportunity: {
          select: { title: true }
        },
        assignedTo: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get top performers (if user is admin/manager)
    let topPerformers = []
    if (['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      topPerformers = await prisma.user.findMany({
        where: {
          role: { in: ['SALES_REP', 'SALES_MANAGER'] },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          _count: {
            select: {
              assignedLeads: true,
              opportunities: true,
            }
          }
        },
        orderBy: {
          opportunities: {
            _count: 'desc'
          }
        },
        take: 5,
      })

      // Get revenue for each performer
      for (const performer of topPerformers) {
        const revenue = await prisma.opportunity.aggregate({
          where: {
            assignedToId: performer.id,
            status: 'WON',
            updatedAt: { gte: startOfMonth },
          },
          _sum: { value: true },
        })
        ;(performer as any).revenue = revenue._sum.value || 0
      }
    }

    // Get monthly trend data
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const [leadsCount, opportunitiesCount, revenue] = await Promise.all([
        prisma.lead.count({
          where: {
            ...userFilter,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.opportunity.count({
          where: {
            ...userFilter,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.opportunity.aggregate({
          where: {
            ...userFilter,
            status: 'WON',
            updatedAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { value: true },
        }),
      ])

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        leads: leadsCount,
        opportunities: opportunitiesCount,
        revenue: revenue._sum.value || 0,
      })
    }

    return NextResponse.json({
      overview: {
        totalLeads,
        newLeads: newLeadsThisWeek,
        opportunities: totalOpportunities,
        openOpportunities,
        wonOpportunities,
        revenue: revenueThisMonth._sum.value || 0,
        yearlyRevenue: revenueThisYear._sum.value || 0,
        conversionRate,
        activitiesThisWeek,
      },
      breakdowns: {
        leadSources: leadSources.map(item => ({
          source: item.source,
          count: item._count.source,
        })),
        leadStatuses: leadStatuses.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        opportunityStages: opportunityStages.map(item => ({
          stage: item.stage,
          count: item._count.stage,
          value: item._sum.value || 0,
        })),
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        subject: activity.subject,
        status: activity.status,
        createdAt: activity.createdAt,
        assignedTo: activity.assignedTo.name,
        lead: activity.lead ? `${activity.lead.firstName} ${activity.lead.lastName}` : null,
        opportunity: activity.opportunity?.title || null,
      })),
      topPerformers,
      monthlyTrends,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
