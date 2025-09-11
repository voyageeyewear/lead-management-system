import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const createActivitySchema = z.object({
  type: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  assignedToId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const leadId = searchParams.get('leadId')
    const opportunityId = searchParams.get('opportunityId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (type) where.type = type
    if (status) where.status = status
    if (assignedTo) where.assignedToId = assignedTo
    if (leadId) where.leadId = leadId
    if (opportunityId) where.opportunityId = opportunityId

    // If user is not admin/manager, only show their assigned activities
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      where.assignedToId = user.id
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          lead: {
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              email: true,
              phone: true,
              company: true 
            }
          },
          opportunity: {
            select: { id: true, title: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get activities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createActivitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedToId: data.assignedToId || user.id,
        createdById: user.id,
      },
      include: {
        lead: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true,
            phone: true,
            company: true 
          }
        },
        opportunity: {
          select: { id: true, title: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
