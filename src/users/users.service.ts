import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

    findByEmail(email: string) {
        return this.usersRepo.findOne({ where: { email } });
    }

    create(user: Partial<User>) {
        return this.usersRepo.save(user);
    }

    async update(id: number, attrs: Partial<User>) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        Object.assign(user, attrs);
        return this.usersRepo.save(user);
    }

    async findById(id: number) {
        return this.usersRepo.findOne({ where: { id } });
    }
}
