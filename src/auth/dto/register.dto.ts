import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @ApiProperty()
  firstName!: string;

  @IsString()
  @MinLength(3)
  @ApiProperty()
  lastName!: string;

  @IsEmail()
  @ApiProperty()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: 'Password must be at least 8 characters, contain at least one letter, one number, and one special character',
  })
  @ApiProperty()
  password!: string;

  @IsString()
  @MinLength(8)
  @ApiProperty()
  confrimPassword!: string;
}