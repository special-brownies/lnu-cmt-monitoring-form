import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPassword = await bcrypt.hash('DebugPass123', 10)
  const facultyPassword = await bcrypt.hash('FacultyPass123', 10)

  await prisma.passwordResetRequest.deleteMany()
  await prisma.equipmentLocationHistory.deleteMany()
  await prisma.equipmentStatusHistory.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.faculty.deleteMany()

  const superAdmin = await prisma.user.create({
    data: {
      name: 'CMT-Admin',
      email: 'debug1772286374@lnu.local',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
    },
  })

  const facultyOne = await prisma.faculty.create({
    data: {
      name: 'Dr. Santos',
      employeeId: 'FAC-1001',
      password: facultyPassword,
    },
  })

  const facultyTwo = await prisma.faculty.create({
    data: {
      name: 'Prof. Cruz',
      employeeId: 'FAC-1002',
      password: facultyPassword,
    },
  })

  await prisma.category.createMany({
    data: [
      { name: 'Computer', description: 'Desktops and laptops' },
      { name: 'Projector', description: 'LCD and LED projectors' },
      { name: 'Switch', description: 'Network switches' },
    ],
    skipDuplicates: true,
  })

  const room = await prisma.room.upsert({
    where: { name: 'ComLab 1' },
    update: {},
    create: { name: 'ComLab 1', building: 'Main', floor: '2' },
  })

  const computerCategory = await prisma.category.findUnique({
    where: { name: 'Computer' },
    select: { id: true },
  })

  if (!computerCategory) {
    throw new Error('Computer category not found after seeding')
  }

  await prisma.equipment.create({
    data: {
      serialNumber: 'PC-001',
      name: 'Dell Optiplex',
      categoryId: computerCategory.id,
      facultyId: facultyOne.id,
      datePurchased: new Date(),
      statusHistory: {
        create: {
          status: 'Working',
          changedById: superAdmin.id,
        },
      },
      locationHistory: {
        create: {
          roomId: room.id,
          assignedById: superAdmin.id,
        },
      },
    },
  })

  await prisma.equipment.create({
    data: {
      serialNumber: 'PC-002',
      name: 'HP EliteDesk',
      categoryId: computerCategory.id,
      facultyId: facultyTwo.id,
      datePurchased: new Date(),
    },
  })

  console.log('Database seeded successfully')
  console.log('SUPER_ADMIN:', 'debug1772286374@lnu.local / DebugPass123')
  console.log('FACULTY:', 'FAC-1001 / FacultyPass123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
