import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { mailTransporterProvider } from './mail-transporter.provider';


@Module({
  providers: [mailTransporterProvider, MailService],
  exports: [MailService],
})

export class MailModule {}
