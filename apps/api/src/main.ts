import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { existsSync, mkdirSync } from 'fs'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const uploadsPath = join(process.cwd(), 'uploads')

  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true })
  }

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (response) => {
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    },
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.enableCors({
    origin: true,
    credentials: true,
  })

  await app.listen(3000, '0.0.0.0')
}

bootstrap()
