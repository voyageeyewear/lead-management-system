import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const bulkUpdateSchema = z.object({
  leadIds: z.array(z.string()),
  updates: z.object({
    status: z.string().optional(),
    assignedToId: z.string().optional(),
    source: z.string().optional(),
    score: z.number().optional(),
  }),
})

const bulkDeleteSchema = z.object({
  leadIds: z.array(z.string()),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadIds, updates } = bulkUpdateSchema.parse(body)

    // Check permissions - only admins and managers can bulk update
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify all leads exist and user has access
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, assignedToId: true, createdById: true }
    })

    if (leads.length !== leadIds.length) {
      return NextResponse.json({ error: 'Some leads not found' }, { status: 404 })
    }

    // For non-admin users, check they have access to all leads
    if (user.role !== 'ADMIN') {
      const hasAccess = leads.every(lead => 
        lead.assignedToId === user.id || lead.createdById === user.id
      )
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Perform bulk update
    const result = await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: updates,
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Successfully updated ${result.count} leads`,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadIds } = bulkDeleteSchema.parse(body)

    // Only admins and managers can bulk delete
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify all leads exist
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true }
    })

    if (leads.length !== leadIds.length) {
      return NextResponse.json({ error: 'Some leads not found' }, { status: 404 })
    }

    // Perform bulk delete
    const result = await prisma.lead.deleteMany({
      where: { id: { in: leadIds } },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} leads`,
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
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
    const { action, leadIds, data } = body

    if (action === 'assign') {
      // Bulk assign leads to a user
      const { assignedToId } = data
      
      if (!assignedToId) {
        return NextResponse.json({ error: 'assignedToId is required' }, { status: 400 })
      }

      // Verify the assignee exists
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, name: true }
      })

      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
      }

      const result = await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { assignedToId },
      })

      return NextResponse.json({
        success: true,
        updatedCount: result.count,
        message: `Successfully assigned ${result.count} leads to ${assignee.name}`,
      })
    } else if (action === 'updateStatus') {
      // Bulk update status
      const { status } = data
      
      if (!status) {
        return NextResponse.json({ error: 'status is required' }, { status: 400 })
      }

      const result = await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data: { status },
      })

      return NextResponse.json({
        success: true,
        updatedCount: result.count,
        message: `Successfully updated status for ${result.count} leads`,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
