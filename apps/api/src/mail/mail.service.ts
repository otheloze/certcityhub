import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

export type SignupAccountType = "student" | "organization" | "tutor";

interface AdminNewMemberNotificationInput {
  email: string;
  accountType: SignupAccountType;
  createdAt: Date;
  organizationName?: string;
  displayName?: string;
}

const DEFAULT_ADMIN_NOTIFICATION_EMAIL = "info@certcityhub.com";
const DEFAULT_FROM_ADDRESS = "CertCityHub <no-reply@certcityhub.com>";

// Every public method here is fire-and-forget from the caller's point of
// view - send() swallows and logs every error itself, so a bad API key or
// a Resend outage never breaks registration/login/password-reset flows
// that happen to trigger an email alongside their real work.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly adminNotificationEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromAddress = this.configService.get<string>("MAIL_FROM_ADDRESS") ?? DEFAULT_FROM_ADDRESS;
    this.adminNotificationEmail =
      this.configService.get<string>("ADMIN_NOTIFICATION_EMAIL") ?? DEFAULT_ADMIN_NOTIFICATION_EMAIL;

    if (!this.resend) {
      this.logger.warn("RESEND_API_KEY not set - emails will be logged only, not sent");
    }
  }

  private async send(to: string, subject: string, html: string, context: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[mail disabled] would send "${subject}" to ${to} (${context})`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.fromAddress, to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send "${subject}" to ${to} (${context})`, error as Error);
    }
  }

  async sendWelcomeEmail(
    to: string,
    accountType: SignupAccountType,
    extra?: { organizationName?: string; displayName?: string },
  ): Promise<void> {
    const nextStep =
      accountType === "organization"
        ? `Your organization${extra?.organizationName ? ` "${extra.organizationName}"` : ""} is ready - sign in to set up your team and grant exam access.`
        : accountType === "tutor"
          ? "Sign in and complete your tutor profile to submit it for review."
          : "Sign in and start practicing - your free plan is already active.";

    const html = `
      <p>Hi,</p>
      <p>Welcome to CertCityHub! Your account (${to}) has been created.</p>
      <p>${nextStep}</p>
    `;
    await this.send(to, "Welcome to CertCityHub", html, "welcome");
  }

  async sendAdminNewMemberNotification(input: AdminNewMemberNotificationInput): Promise<void> {
    const extraLine = input.organizationName
      ? `<p>Organization: ${input.organizationName}</p>`
      : input.displayName
        ? `<p>Display name: ${input.displayName}</p>`
        : "";

    const html = `
      <p>New member registered: <strong>${input.accountType}</strong></p>
      <p>Email: ${input.email}</p>
      ${extraLine}
      <p>Created at: ${input.createdAt.toISOString()}</p>
    `;
    await this.send(
      this.adminNotificationEmail,
      `New member registered: ${input.accountType}`,
      html,
      "admin-new-member",
    );
  }

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    const html = `
      <p>Your CertCityHub password reset code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>
    `;
    await this.send(to, "Your CertCityHub password reset code", html, "password-reset-code");
  }
}
