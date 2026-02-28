import { Controller, Get } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('db-test')
  async dbTest() {
    const categories = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
      take: 5,
    })

    return {
      success: true,
      data: {
        message: 'Database connection successful',
        count: categories.length,
        categories,
      },
    }
  }
}
