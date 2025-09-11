import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  closeDate: z.string().optional(),
  assignedToId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        lead: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true, 
            phone: true,
            company: true,
            jobTitle: true,
            status: true,
            source: true,
          }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        activities: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Check permissions
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role) && 
        opportunity.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Get opportunity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateOpportunitySchema.parse(body)

    // Check if opportunity exists and user has permission
    const existingOpportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
    })

    if (!existingOpportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role) && 
        existingOpportunity.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        ...data,
        closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
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

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Update opportunity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and managers can delete opportunities
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    await prisma.opportunity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete opportunity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
