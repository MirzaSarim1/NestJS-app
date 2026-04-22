import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async register(username: string, password: string) {
        const existingUser = await this.usersService.findByUsername(username);

        if (existingUser) {
        throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.usersService.create({
        username,
        password: hashedPassword,
        });

        return {
            id: user.id,
            username: user.username,
        };
    }
}
