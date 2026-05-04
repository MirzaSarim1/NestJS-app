import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
        private configService: ConfigService,
    ) { }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private generateTokens(userId: number, email: string, role: string) {
        const accessToken = this.jwtService.sign(
            { sub: userId, email, role },
            { expiresIn: '15m' },
        );

        const refreshToken = this.jwtService.sign(
            { sub: userId },
            {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d' as any,
            },
        );

        return { accessToken, refreshToken };
    }

    async register(firstName: string, lastName: string, email: string, password: string, confirmPassword: string) {
        if (password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        } 

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = this.generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const user = await this.usersService.create({
            firstName, lastName, email,
            password: hashedPassword,
            isEmailVerified: false,
            otp, otpExpiresAt,
        });

        await this.mailService.sendOtpEmail(email, otp);

        return { message: 'User registered. Please check your email for the OTP.', userId: user.id };
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
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');
        if (!user.isEmailVerified) throw new UnauthorizedException('Please verify your email before logging in');

        const { accessToken, refreshToken } = this.generateTokens(user.id, user.email, user.role);

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await this.usersService.update(user.id, { refreshTokenHash });

        return { access_token: accessToken, refresh_token: refreshToken };
    }

    async refresh(refreshToken: string) {
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.usersService.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user.id, user.email, user.role);
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

        await this.usersService.update(user.id, { refreshTokenHash: newRefreshTokenHash });

        return { access_token: accessToken, refresh_token: newRefreshToken };
    }

    async logout(refreshToken: string) {
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.usersService.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            return { message: 'Logged out successfully' };
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isMatch) return { message: 'Logged out successfully' };

        await this.usersService.update(user.id, { refreshTokenHash: null });
        return { message: 'Logged out successfully' };
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
        if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
            throw new BadRequestException('Invalid or expired reset code');
        }

        if (new Date() > user.passwordResetOtpExpiresAt) {
            throw new BadRequestException('Reset code expired');
        }

        if (user.passwordResetOtp !== resetOtp) {
            throw new BadRequestException('Invalid reset code');
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
