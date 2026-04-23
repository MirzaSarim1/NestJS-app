import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsString()
  @ApiProperty()
  username!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty()
  password!: string;
}