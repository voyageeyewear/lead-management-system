import { PrismaClient } from '@prisma/client'
import { hashPassword } from './auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await hashPassword('password')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+1-555-0101',
      department: 'Management',
    },
  })

  // Create sales manager
  const managerPassword = await hashPassword('password')
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Sales Manager',
      password: managerPassword,
      role: 'SALES_MANAGER',
      phone: '+1-555-0102',
      department: 'Sales',
    },
  })

  // Create sales reps
  const rep1Password = await hashPassword('password')
  const rep1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: rep1Password,
      role: 'SALES_REP',
      phone: '+1-555-0103',
      department: 'Sales',
    },
  })

  const rep2Password = await hashPassword('password')
  const rep2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: rep2Password,
      role: 'SALES_REP',
      phone: '+1-555-0104',
      department: 'Sales',
    },
  })

  console.log('👥 Created users')

  // Create sample leads
  const sampleLeads = [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@techcorp.com',
      phone: '+1-555-1001',
      company: 'TechCorp Inc.',
      jobTitle: 'CTO',
      source: 'WEBSITE',
      status: 'NEW',
      score: 85,
      value: 50000,
      description: 'Interested in enterprise solution',
      createdById: admin.id,
      assignedToId: rep1.id,
    },
    {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@startup.io',
      phone: '+1-555-1002',
      company: 'Startup.io',
      jobTitle: 'CEO',
      source: 'REFERRAL',
      status: 'CONTACTED',
      score: 75,
      value: 25000,
      description: 'Looking for scalable CRM solution',
      createdById: manager.id,
      assignedToId: rep2.id,
    },
    {
      firstName: 'Carol',
      lastName: 'Brown',
      email: 'carol.brown@enterprise.com',
      phone: '+1-555-1003',
      company: 'Enterprise Solutions',
      jobTitle: 'VP Sales',
      source: 'EMAIL',
      status: 'QUALIFIED',
      score: 90,
      value: 75000,
      description: 'Ready to move forward with implementation',
      createdById: rep1.id,
      assignedToId: rep1.id,
    },
    {
      firstName: 'David',
      lastName: 'Lee',
      email: 'david.lee@consulting.com',
      phone: '+1-555-1004',
      company: 'Lee Consulting',
      jobTitle: 'Managing Director',
      source: 'SOCIAL_MEDIA',
      status: 'PROPOSAL',
      score: 80,
      value: 40000,
      description: 'Needs custom integration capabilities',
      createdById: rep2.id,
      assignedToId: rep2.id,
    },
    {
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@manufacturing.com',
      phone: '+1-555-1005',
      company: 'Davis Manufacturing',
      jobTitle: 'Operations Manager',
      source: 'ADVERTISEMENT',
      status: 'NEGOTIATION',
      score: 95,
      value: 100000,
      description: 'Large manufacturing company, high potential',
      createdById: manager.id,
      assignedToId: rep1.id,
    },
  ]

  const createdLeads = []
  for (const leadData of sampleLeads) {
    const lead = await prisma.lead.create({
      data: leadData,
    })
    createdLeads.push(lead)
  }

  console.log('📋 Created sample leads')

  // Create sample opportunities
  const opportunities = [
    {
      title: 'TechCorp Enterprise Deal',
      description: 'Full CRM implementation for 500+ users',
      value: 50000,
      probability: 75,
      stage: 'QUALIFICATION',
      status: 'OPEN',
      closeDate: new Date('2024-03-15'),
      leadId: createdLeads[0].id,
      assignedToId: rep1.id,
    },
    {
      title: 'Startup.io Growth Package',
      description: 'Scalable solution for growing startup',
      value: 25000,
      probability: 60,
      stage: 'NEEDS_ANALYSIS',
      status: 'OPEN',
      closeDate: new Date('2024-02-28'),
      leadId: createdLeads[1].id,
      assignedToId: rep2.id,
    },
    {
      title: 'Enterprise Solutions Implementation',
      description: 'Custom CRM with advanced reporting',
      value: 75000,
      probability: 90,
      stage: 'PROPOSAL',
      status: 'OPEN',
      closeDate: new Date('2024-04-01'),
      leadId: createdLeads[2].id,
      assignedToId: rep1.id,
    },
  ]

  for (const oppData of opportunities) {
    await prisma.opportunity.create({
      data: oppData,
    })
  }

  console.log('🎯 Created sample opportunities')

  // Create sample activities
  const activities = [
    {
      type: 'CALL',
      title: 'Initial discovery call',
      description: 'Discussed requirements and timeline',
      status: 'COMPLETED',
      priority: 'HIGH',
      completedAt: new Date('2024-01-15T10:00:00Z'),
      leadId: createdLeads[0].id,
      assignedToId: rep1.id,
      createdById: rep1.id,
    },
    {
      type: 'EMAIL',
      title: 'Follow-up email with proposal',
      description: 'Sent detailed proposal document',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      completedAt: new Date('2024-01-16T14:30:00Z'),
      leadId: createdLeads[0].id,
      assignedToId: rep1.id,
      createdById: rep1.id,
    },
    {
      type: 'MEETING',
      title: 'Demo presentation',
      description: 'Product demonstration scheduled',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date('2024-02-01T15:00:00Z'),
      leadId: createdLeads[1].id,
      assignedToId: rep2.id,
      createdById: rep2.id,
    },
  ]

  for (const activityData of activities) {
    await prisma.activity.create({
      data: activityData,
    })
  }

  console.log('📅 Created sample activities')

  // Create sample notes
  const notes = [
    {
      content: 'Lead is very interested in our enterprise features. Mentioned they need multi-tenant support.',
      leadId: createdLeads[0].id,
      authorId: rep1.id,
    },
    {
      content: 'Budget confirmed at $25K. Decision maker is the CEO, timeline is Q1.',
      leadId: createdLeads[1].id,
      authorId: rep2.id,
    },
    {
      content: 'Technical requirements discussion went well. They need API integrations with their existing systems.',
      leadId: createdLeads[2].id,
      authorId: rep1.id,
    },
  ]

  for (const noteData of notes) {
    await prisma.note.create({
      data: noteData,
    })
  }

  console.log('📝 Created sample notes')

  console.log('✅ Database seeding completed!')
  console.log('\n📧 Login credentials:')
  console.log('Admin: admin@example.com / password')
  console.log('Manager: manager@example.com / password')
  console.log('Sales Rep 1: john@example.com / password')
  console.log('Sales Rep 2: jane@example.com / password')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
