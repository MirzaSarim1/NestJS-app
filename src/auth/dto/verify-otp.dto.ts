import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @IsEmail()
  @ApiProperty()
  email!: string;

  @IsString()
  @Length(6, 6)
  @ApiProperty()
  otp!: string;
}
