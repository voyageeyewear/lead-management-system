import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.string(),
  phone: z.string().optional(),
  department: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and managers can view all users
    if (!['ADMIN', 'SALES_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const department = searchParams.get('department')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) where.role = role
    if (department) where.department = department

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          department: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              assignedLeads: true,
              opportunities: true,
              assignedActivities: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    // Get performance data for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [leadsThisMonth, opportunitiesThisMonth, revenue] = await Promise.all([
          prisma.lead.count({
            where: {
              assignedToId: u.id,
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          }),
          prisma.opportunity.count({
            where: {
              assignedToId: u.id,
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          }),
          prisma.opportunity.aggregate({
            where: {
              assignedToId: u.id,
              status: 'WON',
              updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            },
            _sum: { value: true }
          })
        ])

        return {
          ...u,
          stats: {
            leadsThisMonth,
            opportunitiesThisMonth,
            revenue: revenue._sum.value || 0,
          }
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        department: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
