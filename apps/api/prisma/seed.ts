import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as bcrypt from "bcrypt"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin12345", 10)

  const admin = await prisma.user.upsert({
    where: { employeeId: "admin@lnu.local" },
    update: { passwordHash: adminPasswordHash },
    create: {
      employeeId: "admin@lnu.local",
      passwordHash: adminPasswordHash,
    },
  })

  await prisma.faculty.createMany({
    data: [
      { name: "Dr. Santos", department: "IT" },
      { name: "Prof. Cruz", department: "CS" }
    ],
    skipDuplicates: true,
  })

  await prisma.category.createMany({
    data: [
      { name: "Computer", description: "Desktops and laptops" },
      { name: "Projector", description: "LCD and LED projectors" },
      { name: "Switch", description: "Network switches" }
    ],
    skipDuplicates: true,
  })

  const room = await prisma.room.upsert({
    where: { name: "ComLab 1" },
    update: {},
    create: { name: "ComLab 1", building: "Main", floor: "2" },
  })

  await prisma.equipment.upsert({
    where: { serialNumber: "PC-001" },
    update: {
      categoryId: 1,
      facultyId: 1,
      name: "Dell Optiplex",
      datePurchased: new Date(),
    },
    create: {
      serialNumber: "PC-001",
      name: "Dell Optiplex",
      categoryId: 1,
      facultyId: 1,
      datePurchased: new Date(),
      statusHistory: {
        create: { status: "Working", changedById: admin.id }
      },
      locationHistory: {
        create: { roomId: room.id, assignedById: admin.id }
      }
    },
  })

  console.log("Database seeded")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
