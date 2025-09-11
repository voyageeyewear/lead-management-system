import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if setup is already done
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json({ 
        message: 'Database already initialized',
        userCount 
      })
    }

    // Create admin user
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('password', 10)

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        department: 'Management',
        isActive: true,
      },
    })

    // Create sample sales manager
    const salesManagerPassword = await bcrypt.hash('password', 10)
    const salesManager = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Sales Manager',
        password: salesManagerPassword,
        role: 'SALES_MANAGER',
        department: 'Sales',
        isActive: true,
      },
    })

    // Create sample sales rep
    const salesRepPassword = await bcrypt.hash('password', 10)
    const salesRep = await prisma.user.create({
      data: {
        email: 'rep@example.com',
        name: 'Sales Representative',
        password: salesRepPassword,
        role: 'SALES_REP',
        department: 'Sales',
        isActive: true,
      },
    })

    // Create sample leads
    const sampleLeads = await prisma.lead.createMany({
      data: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+919876543210',
          company: 'Tech Solutions Inc',
          jobTitle: 'CTO',
          source: 'WEBSITE',
          status: 'NEW',
          score: 85,
          value: 50000,
          description: 'Interested in our enterprise solution',
          assignedToId: salesRep.id,
          createdById: adminUser.id,
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+919876543211',
          company: 'Digital Marketing Pro',
          jobTitle: 'Marketing Director',
          source: 'REFERRAL',
          status: 'CONTACTED',
          score: 70,
          value: 35000,
          description: 'Looking for marketing automation tools',
          assignedToId: salesRep.id,
          createdById: salesManager.id,
        },
        {
          firstName: 'Atul',
          lastName: 'Saini',
          email: 'atul.saini@example.com',
          phone: '8852968844',
          company: 'Saini Enterprises',
          jobTitle: 'CEO',
          source: 'CSV_IMPORT',
          status: 'QUALIFIED',
          score: 95,
          value: 100000,
          description: 'High-value prospect for premium package',
          assignedToId: salesManager.id,
          createdById: adminUser.id,
        }
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        users: 3,
        leads: 3,
        adminUser: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        }
      }
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
