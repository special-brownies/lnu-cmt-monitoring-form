import { Type } from 'class-transformer'
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator'

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  serialNumber?: string

  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  facultyId?: number

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  datePurchased?: Date
}
