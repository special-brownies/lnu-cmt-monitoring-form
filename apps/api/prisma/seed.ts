import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

const BACKUP_ADMIN_EMAIL = 'debug1772286374@lnu.local'
const BACKUP_ADMIN_PASSWORD = 'DebugPass123'
const FACULTY_DEFAULT_PASSWORD = 'Faculty123'

const facultyNames = [
  'Dr. Maria Santos',
  'Prof. John Cruz',
  'Dr. Angela Rivera',
  'Prof. Carlo Mendoza',
  'Dr. Liza Fernandez',
  'Prof. Noel Garcia',
  'Dr. Irene Tolentino',
  'Prof. Mark Reyes',
  'Dr. Hannah Bautista',
  'Prof. Samuel Dela Cruz',
  'Dr. Yvette Ramos',
  'Prof. Kevin Navarro',
  'Dr. Camille Gomez',
  'Prof. Dennis Villanueva',
  'Dr. Patricia Ortega',
  'Prof. Miguel Aquino',
  'Dr. Florence Lim',
  'Prof. Jerome Castillo',
  'Dr. Beatrice Tan',
  'Prof. Marvin Sy',
]

const categorySeeds = [
  { name: 'Desktop', description: 'Desktop workstations and all-in-one units' },
  { name: 'Laptop', description: 'Portable faculty and office laptops' },
  { name: 'Printer', description: 'Laser and inkjet printers' },
  { name: 'Network Device', description: 'Routers, switches, and access points' },
]

const roomSeeds = [
  { name: 'ComLab 1', building: 'Main', floor: '2' },
  { name: 'ComLab 2', building: 'Main', floor: '2' },
  { name: 'ComLab 3', building: 'Main', floor: '3' },
  { name: 'IT Office', building: 'Admin', floor: '1' },
  { name: 'Dean Office', building: 'Admin', floor: '2' },
  { name: 'Faculty Room A', building: 'Main', floor: '1' },
  { name: 'Faculty Room B', building: 'Main', floor: '1' },
  { name: 'Server Room', building: 'Admin', floor: '1' },
  { name: 'Library Hub', building: 'Library', floor: '2' },
  { name: 'Registrar Annex', building: 'Annex', floor: '1' },
]

const equipmentStatuses = [
  'Active',
  'Maintenance',
  'Defective',
  'Assigned',
  'Available',
] as const

async function main() {
  const adminPasswordHash = await bcrypt.hash(BACKUP_ADMIN_PASSWORD, 10)
  const facultyPasswordHash = await bcrypt.hash(FACULTY_DEFAULT_PASSWORD, 10)

  const backupAdmin = await prisma.user.upsert({
    where: { email: BACKUP_ADMIN_EMAIL },
    update: {
      name: 'Backup Super Admin',
      role: Role.SUPER_ADMIN,
      password: adminPasswordHash,
    },
    create: {
      name: 'Backup Super Admin',
      email: BACKUP_ADMIN_EMAIL,
      password: adminPasswordHash,
      role: Role.SUPER_ADMIN,
    },
  })

  const faculties: Array<{ id: string; employeeId: string; name: string }> = []
  for (let index = 0; index < facultyNames.length; index += 1) {
    const employeeId = `FAC-${1001 + index}`
    const faculty = await prisma.faculty.upsert({
      where: { employeeId },
      update: {
        name: facultyNames[index],
        password: facultyPasswordHash,
      },
      create: {
        name: facultyNames[index],
        employeeId,
        password: facultyPasswordHash,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
      },
    })
    faculties.push(faculty)
  }

  const categoryMap = new Map<string, number>()
  for (const categorySeed of categorySeeds) {
    const category = await prisma.category.upsert({
      where: { name: categorySeed.name },
      update: {
        description: categorySeed.description,
      },
      create: categorySeed,
      select: { id: true, name: true },
    })

    categoryMap.set(category.name, category.id)
  }

  const roomMap = new Map<string, number>()
  for (const roomSeed of roomSeeds) {
    const room = await prisma.room.upsert({
      where: { name: roomSeed.name },
      update: {
        building: roomSeed.building,
        floor: roomSeed.floor,
      },
      create: roomSeed,
      select: { id: true, name: true },
    })

    roomMap.set(room.name, room.id)
  }

  const equipmentModelsByCategory: Record<string, string[]> = {
    Desktop: ['Dell OptiPlex 7090', 'HP EliteDesk 800', 'Lenovo ThinkCentre M70'],
    Laptop: ['Lenovo ThinkPad T14', 'HP ProBook 450', 'Dell Latitude 5430'],
    Printer: ['Epson L3250', 'Brother HL-L2370DW', 'Canon PIXMA G3010'],
    'Network Device': ['Cisco CBS250 Switch', 'MikroTik hAP ac2', 'TP-Link Omada EAP610'],
  }

  const categoryNames = categorySeeds.map((category) => category.name)
  const roomNames = roomSeeds.map((room) => room.name)
  const equipmentCount = 26

  for (let index = 0; index < equipmentCount; index += 1) {
    const categoryName = categoryNames[index % categoryNames.length]
    const roomName = roomNames[index % roomNames.length]
    const status = equipmentStatuses[index % equipmentStatuses.length]
    const faculty = faculties[index % faculties.length]
    const modelOptions = equipmentModelsByCategory[categoryName]
    const modelName = modelOptions[index % modelOptions.length]
    const serialNumber = `LNU-EQ-${2001 + index}`
    const equipmentName = `${modelName} #${index + 1}`
    const datePurchased = new Date(
      2021 + (index % 5),
      (index * 2) % 12,
      ((index * 3) % 27) + 1,
    )

    const categoryId = categoryMap.get(categoryName)
    const roomId = roomMap.get(roomName)

    if (!categoryId || !roomId) {
      throw new Error('Category or room seed missing while creating equipment')
    }

    const equipment = await prisma.equipment.upsert({
      where: { serialNumber },
      update: {
        name: equipmentName,
        categoryId,
        facultyId: faculty.id,
        datePurchased,
      },
      create: {
        serialNumber,
        name: equipmentName,
        categoryId,
        facultyId: faculty.id,
        datePurchased,
      },
      select: {
        id: true,
        serialNumber: true,
      },
    })

    const latestStatus = await prisma.equipmentStatusHistory.findFirst({
      where: { equipmentId: equipment.id },
      orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
      select: { status: true },
    })

    if (!latestStatus || latestStatus.status !== status) {
      await prisma.equipmentStatusHistory.create({
        data: {
          equipmentId: equipment.id,
          status,
          changedById: backupAdmin.id,
          notes: `Seeded status for ${equipment.serialNumber}`,
        },
      })
    }

    const latestRoom = await prisma.equipmentLocationHistory.findFirst({
      where: { equipmentId: equipment.id },
      orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
      select: { roomId: true },
    })

    if (!latestRoom || latestRoom.roomId !== roomId) {
      await prisma.equipmentLocationHistory.create({
        data: {
          equipmentId: equipment.id,
          roomId,
          assignedById: backupAdmin.id,
        },
      })
    }
  }

  const pendingFacultyIds = faculties.slice(0, 3).map((faculty) => faculty.id)
  for (const facultyId of pendingFacultyIds) {
    const pendingRequest = await prisma.passwordResetRequest.findFirst({
      where: { facultyId, status: 'PENDING' },
      select: { id: true },
    })

    if (!pendingRequest) {
      await prisma.passwordResetRequest.create({
        data: {
          facultyId,
          status: 'PENDING',
        },
      })
    }
  }

  const completedRequest = await prisma.passwordResetRequest.findFirst({
    where: { status: 'COMPLETED' },
    select: { id: true },
  })

  if (!completedRequest) {
    await prisma.passwordResetRequest.create({
      data: {
        facultyId: faculties[3].id,
        status: 'COMPLETED',
        resolvedAt: new Date(),
        resolvedBy: backupAdmin.id,
      },
    })
  }

  console.log('Database seeded successfully')
  console.log('SUPER_ADMIN:', `${BACKUP_ADMIN_EMAIL} / ${BACKUP_ADMIN_PASSWORD}`)
  console.log('FACULTY DEFAULT PASSWORD:', FACULTY_DEFAULT_PASSWORD)
  console.log('FACULTY SAMPLE:', 'FAC-1001 / Faculty123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
