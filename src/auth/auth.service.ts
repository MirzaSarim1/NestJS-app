import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import passport from 'passport';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async register(
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        confirmPassword: string,
    ) {
        if (password !== confirmPassword) {
            throw new BadRequestException('Password do not match');
        }
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = this.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const user = await this.usersService.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            isEmailVerified: false,
            otp,
            otpExpiresAt,
        });

        await this.mailService.sendOtpEmail(email, otp);

        return {
            message: 'User registered. Please check your email for the OTP.',
            userId: user.id,
        };
    }

    async verifyOtp(email: string, otp: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isEmailVerified) {
            return { message: 'Email already verified' };
        }

        if (!user.otp || !user.otpExpiresAt) {
            throw new BadRequestException('No OTP found. Please request a new one.');
        }

        if (new Date() > user.otpExpiresAt) {
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        if (user.otp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        await this.usersService.update(user.id, {
            isEmailVerified: true,
            otp: null,
            otpExpiresAt: null,
        })

        return { message: 'Email verified successfully. You can now log in.' };
    }

    async resendOtp(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isEmailVerified) {
            return { message: 'Email already verified' };
        }

        const otp = this.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.usersService.update(user.id, { otp, otpExpiresAt });
        await this.mailService.sendOtpEmail(email, otp);

        return { message: 'New OTP sent. Please check your email.' };
    }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Email is not verified. Please verify email first');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If an account exists, a reset code has been sent.' };
        }

        if (!user.isEmailVerified) {
            throw new BadRequestException('Email is not verified. Please verify email first');
        }

        const otp = this.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.usersService.update(user.id, {
            passwordResetOtp: otp,
            passwordResetOtpExpiresAt: otpExpiresAt,
        });

        await this.mailService.sendOtpEmail(email, otp);

        return { message: 'If an account exists, a reset code has been sent.' };
    }

    async resetPassword(
        email: string,
        resetOtp: string,
        newPassword: string,
        confirmNewPassword: string
    ) {
        if (newPassword !== confirmNewPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new BadRequestException('Invalid or expired reset code');
        }

        if (!user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
            throw new BadRequestException('Invalid or expired reset code');
        }

        if (new Date() > user.passwordResetOtpExpiresAt) {
            throw new BadRequestException('Reset code has expired');
        }

        if (user.passwordResetOtp !== resetOtp) {
            throw new BadRequestException('Invalid or expired reset code');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.usersService.update(user.id, {
            password: hashedPassword,
            passwordResetOtp: null,
            passwordResetOtpExpiresAt: null,
        });

        return { message: 'Password reset successfully. You can now log in.' };
    }
}
