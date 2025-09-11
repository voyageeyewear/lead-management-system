import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const importLeadSchema = z.object({
  full_name: z.string().min(1),
  phone_number: z.string().optional(),
  company_name: z.string().optional(),
  city: z.string().optional(),
  assignedToId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and managers can import leads
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { leads, defaultAssignedToId } = body

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
      createdLeads: [] as any[],
    }

    // Process each lead
    for (let i = 0; i < leads.length; i++) {
      try {
        const leadData = leads[i]
        
        // Parse and validate the lead data
        const validatedData = importLeadSchema.parse(leadData)
        
        // Split full name into first and last name
        const nameParts = validatedData.full_name.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Check if lead already exists (by email or phone)
        let existingLead = null
        if (validatedData.phone_number) {
          existingLead = await prisma.lead.findFirst({
            where: {
              OR: [
                { phone: validatedData.phone_number },
                { 
                  AND: [
                    { firstName: firstName },
                    { lastName: lastName },
                    { company: validatedData.company_name || null }
                  ]
                }
              ]
            }
          })
        }

        if (existingLead) {
          results.failed++
          results.errors.push(`Row ${i + 1}: Lead already exists - ${validatedData.full_name}`)
          continue
        }

        // Generate email if not provided (for demo purposes)
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${(validatedData.company_name || 'example').toLowerCase().replace(/\s+/g, '')}.com`
          .replace(/[^a-zA-Z0-9@.-]/g, '')

        // Create description with city information
        let description = null
        if (validatedData.city) {
          description = `Location: ${validatedData.city}`
        }

        // Create the lead
        const newLead = await prisma.lead.create({
          data: {
            firstName,
            lastName,
            email,
            phone: validatedData.phone_number || null,
            company: validatedData.company_name || null,
            jobTitle: null,
            source: 'CSV_IMPORT',
            status: 'NEW',
            score: 0,
            description,
            createdById: user.id,
            assignedToId: validatedData.assignedToId || defaultAssignedToId || user.id,
          },
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true }
            },
            createdBy: {
              select: { id: true, name: true, email: true }
            },
          }
        })

        results.successful++
        results.createdLeads.push(newLead)

      } catch (error) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data format'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      results,
    })

  } catch (error) {
    console.error('Import leads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
