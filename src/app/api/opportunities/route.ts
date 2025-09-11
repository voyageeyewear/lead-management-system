import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const createOpportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  value: z.number().min(0),
  probability: z.number().min(0).max(100).optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  closeDate: z.string().optional(),
  leadId: z.string(),
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
    const stage = searchParams.get('stage')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lead: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
          ]
        }},
      ]
    }

    if (stage) where.stage = stage
    if (status) where.status = status
    if (assignedTo) where.assignedToId = assignedTo

    // If user is not admin/manager, only show their assigned opportunities
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      where.assignedToId = user.id
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          lead: {
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              email: true, 
              company: true 
            }
          },
          assignedTo: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          _count: {
            select: { activities: true, notes: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.opportunity.count({ where }),
    ])

    return NextResponse.json({
      opportunities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get opportunities error:', error)
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
    const data = createOpportunitySchema.parse(body)

    // Verify lead exists and user has access
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role) && 
        lead.assignedToId !== user.id && 
        lead.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        ...data,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        assignedToId: data.assignedToId || user.id,
      },
      include: {
        lead: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            company: true 
          }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
      },
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error('Create opportunity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
