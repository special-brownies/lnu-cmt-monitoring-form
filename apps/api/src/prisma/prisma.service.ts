import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined')
    }

    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
    this.logger.log('Connected to PostgreSQL via Prisma')
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
    this.logger.log('Disconnected Prisma client')
  }
}
