import { Type } from 'class-transformer'
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator'

export class CreateStatusDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  equipmentId!: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  status!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  changedById?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string
}
