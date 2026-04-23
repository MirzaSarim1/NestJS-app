import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @ApiProperty()
  username!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty()
  password!: string;
}