import { IsEmail, IsString, MinLength, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsEmail()
  @ApiProperty()
  email!: string;

  @IsString()
  @Length(6, 6)
  @ApiProperty()
  resetOtp!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'Password must be at least 8 characters, contain at least one letter, one number, and one special character',
  })
  @ApiProperty()
  newPassword!: string;

  @IsString()
  @MinLength(8)
  @ApiProperty()
  confirmNewPassword!: string;
}
