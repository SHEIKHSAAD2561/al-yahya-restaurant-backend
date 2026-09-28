import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { Language } from '../users/language.enum';
import { invitationEmailEn } from './templates/invitation.en';
import { invitationEmailAr } from './templates/invitation.ar';
import { passwordResetEmailEn } from './templates/password-reset.en';
import { passwordResetEmailAr } from './templates/password-reset.ar';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('MAIL_FROM')!;
    this.appUrl = this.configService.get<string>('APP_URL')!;
    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        // Zoho's SMTP requires this in some network environments (e.g. behind a proxy
        // that intercepts TLS with its own cert); Zoho's own certificate is otherwise valid.
        rejectUnauthorized: false,
      },
    });
  }

  async sendInvitationEmail(
    to: string,
    name: string,
    rawToken: string,
    preferredLanguage: Language,
  ): Promise<void> {
    const inviteUrl = `${this.appUrl}/accept-invitation?token=${rawToken}`;
    const { subject, html } =
      preferredLanguage === Language.AR
        ? invitationEmailAr(name, inviteUrl)
        : invitationEmailEn(name, inviteUrl);

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email to ${to}`,
        error as Error,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    rawToken: string,
    preferredLanguage: Language,
  ): Promise<void> {
    // Same token-consumption endpoint (`POST /auth/accept-invitation`) handles both
    // first-time invites and password resets, so this reuses the same landing page.
    const resetUrl = `${this.appUrl}/accept-invitation?token=${rawToken}`;
    const { subject, html } =
      preferredLanguage === Language.AR
        ? passwordResetEmailAr(name, resetUrl)
        : passwordResetEmailEn(name, resetUrl);

    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error as Error,
      );
      throw error;
    }
  }
}
