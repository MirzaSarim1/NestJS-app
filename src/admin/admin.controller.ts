import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Req } from '@nestjs/common';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Roles('admin')
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Roles('admin')
  @Get('users')
  getAdminUsers(@Req() req) {
    return this.adminService.getAdminUsers(req);
  }

  @Roles('admin')
  @Get('protected')
  getProtectedResource() {
    return {
      message: 'This resource is only accessible to admins',
    };
  }
}
