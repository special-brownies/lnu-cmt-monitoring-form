import { Type } from 'class-transformer'
import {
  IsDate,
  IsInt,
  IsNotEmpty,
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

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  facultyId!: number

  @Type(() => Date)
  @IsDate()
  datePurchased!: Date
}
