import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const updateActivitySchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
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

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
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
          select: { id: true, title: true, value: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has access to this activity
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role) && 
        activity.assignedToId !== user.id && 
        activity.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Get activity error:', error)
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
    const data = updateActivitySchema.parse(body)

    // Check if activity exists and user has access
    const existingActivity = await prisma.activity.findUnique({
      where: { id: params.id },
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role) && 
        existingActivity.assignedToId !== user.id && 
        existingActivity.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
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
          select: { id: true, title: true, value: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Update activity error:', error)
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

    // Check if activity exists and user has access
    const existingActivity = await prisma.activity.findUnique({
      where: { id: params.id },
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role) && 
        existingActivity.assignedToId !== user.id && 
        existingActivity.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.activity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Delete activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
