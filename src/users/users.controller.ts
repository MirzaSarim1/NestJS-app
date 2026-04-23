import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtUser } from './interfaces/jwtUser.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@GetUser() user: JwtUser) {
        return user;
    }
}
