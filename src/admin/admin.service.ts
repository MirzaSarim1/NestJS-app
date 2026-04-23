import { Injectable, Req } from '@nestjs/common';

@Injectable()
export class AdminService {
  getDashboard() {
    return {
      message: 'Welcome to Admin Dashboard',
      stats: {
        totalUsers: 42,
        activeUsers: 35,
        totalRevenue: 15230,
      },
    };
  }

  getAdminUsers(@Req() req) {
    return {
      requestingUser: req.user,
    };
  }
}
