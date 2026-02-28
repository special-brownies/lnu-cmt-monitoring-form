import { IsString, Length } from 'class-validator'

export class ResolvePasswordRequestDto {
  @IsString()
  @Length(8, 72)
  newPassword!: string
}
