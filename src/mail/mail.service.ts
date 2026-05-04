import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail-transporter.token';

@Injectable()
export class MailService {

    constructor(
        @Inject(MAIL_TRANSPORTER) private transporter: nodemailer.Transporter,
        private configService: ConfigService,
    ) {}

    async sendOtpEmail(to: string, otp: string) {
        await this.transporter.sendMail({
            from: this.configService.get<string>('SMTP_FROM'),
            to,
            subject: 'Your Verification Code',
            html: `
                <h2>Email Verification</h2>
                <p>Your OTP code is: <strong>${otp}</strong></p>
                <p>This code expires in 10 minutes.</p>
            `,
        });
    }
}

