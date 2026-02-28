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
  @IsString()
  @IsNotEmpty()
  changedById?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string
}
