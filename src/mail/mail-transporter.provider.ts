import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail-transporter.token';

export const mailTransporterProvider = {
  provide: MAIL_TRANSPORTER,
  useFactory: async (configService: ConfigService) => {
    const transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT'),
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });

    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      throw new Error('Failed to connect to SMTP server. Check your .env credentials.');
    }

    return transporter;
  },
  inject: [ConfigService],
};
