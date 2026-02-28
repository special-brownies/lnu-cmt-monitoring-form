import { Type } from 'class-transformer'
import {
  IsDate,
  IsInt,
  IsNotEmpty,
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
  @IsString()
  @IsNotEmpty()
  facultyId?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  datePurchased?: Date
}
