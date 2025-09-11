import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    // Build where clause based on user role
    const userFilter = ['ADMIN', 'SALES_MANAGER'].includes(user.role) 
      ? {} 
      : { assignedToId: user.id }

    // Get leads data
    const leads = await prisma.lead.findMany({
      where: userFilter,
      include: {
        assignedTo: {
          select: { name: true, email: true }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        opportunities: {
          select: { 
            title: true, 
            value: true, 
            stage: true, 
            status: true 
          }
        },
        _count: {
          select: { activities: true, notes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Company',
        'Job Title',
        'Source',
        'Status',
        'Score',
        'Value',
        'Description',
        'Assigned To',
        'Created By',
        'Created At',
        'Last Updated',
        'Activities Count',
        'Notes Count',
        'Opportunities Count'
      ]

      const csvRows = leads.map(lead => [
        lead.id,
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.phone || '',
        lead.company || '',
        lead.jobTitle || '',
        lead.source,
        lead.status,
        lead.score,
        lead.value || '',
        lead.description || '',
        lead.assignedTo?.name || '',
        lead.createdBy.name,
        lead.createdAt.toISOString(),
        lead.updatedAt.toISOString(),
        lead._count.activities,
        lead._count.notes,
        lead.opportunities.length
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => 
          row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="leads_export.csv"',
        },
      })
    } else if (format === 'json') {
      // Generate JSON
      const jsonData = {
        exportDate: new Date().toISOString(),
        exportedBy: user.name,
        totalRecords: leads.length,
        leads: leads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          jobTitle: lead.jobTitle,
          source: lead.source,
          status: lead.status,
          score: lead.score,
          value: lead.value,
          description: lead.description,
          assignedTo: lead.assignedTo?.name,
          createdBy: lead.createdBy.name,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          lastContactedAt: lead.lastContactedAt,
          stats: {
            activitiesCount: lead._count.activities,
            notesCount: lead._count.notes,
            opportunitiesCount: lead.opportunities.length,
          },
          opportunities: lead.opportunities,
        }))
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="leads_export.json"',
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
