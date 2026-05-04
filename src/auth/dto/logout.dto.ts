import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LogoutDto {
    @IsString()
    @ApiProperty()
    refreshToken!: string;
}
