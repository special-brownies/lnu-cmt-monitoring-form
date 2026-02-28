import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsPositive } from 'class-validator'

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
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  assignedById?: number
}
