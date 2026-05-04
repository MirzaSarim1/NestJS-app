import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail-transporter.token';

export const mailTransporterProvider = {
  provide: MAIL_TRANSPORTER,
  useFactory: (configService: ConfigService) => {
    return nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT'),
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  },
  inject: [ConfigService],
};
