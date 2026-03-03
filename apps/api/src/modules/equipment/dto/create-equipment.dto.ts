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

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  serialNumber!: string

  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId!: number

  @IsString()
  @IsNotEmpty()
  facultyId!: string

  @Type(() => Date)
  @IsDate()
  datePurchased!: Date

  @IsOptional()
  @IsString()
  @Length(2, 120)
  customCategoryName?: string
}
