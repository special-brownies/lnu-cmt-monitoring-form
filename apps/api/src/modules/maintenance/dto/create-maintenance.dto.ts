import { Type } from 'class-transformer'
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator'

export class CreateMaintenanceDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  equipmentId!: number

  @Type(() => Date)
  @IsDate()
  scheduledDate!: Date

  @IsOptional()
  @IsString()
  @MaxLength(120)
  technician?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string
}
