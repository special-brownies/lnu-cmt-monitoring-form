import { Type } from 'class-transformer'
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator'

export class CreateLocationDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  equipmentId!: number

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roomId!: number

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assignedById?: string
}
