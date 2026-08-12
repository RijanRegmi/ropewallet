import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export class EmailService {
  private static getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
  }

  private static getFromAddress(): string {
    return process.env.EMAIL_FROM || 'noreply@ropewallet.com';
  }

  private static getSmtpTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const user = process.env.SMTP_USER || 'ropewallet.official@gmail.com';
    const pass = process.env.SMTP_PASS || 'rcxovqiwdilxmkxh';

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private static async sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const from = this.getFromAddress();
    const resendClient = this.getResendClient();

    // 1. Primary Engine: Resend API
    if (resendClient) {
      try {
        const response = await resendClient.emails.send({
          from,
          to,
          subject,
          html,
          text,
        });

        if (response.error) {
          console.warn('[EmailService] Primary Resend API error, switching to backup SMTP:', response.error);
        } else {
          console.log(`[EmailService] Delivered email via Resend to ${to}:`, response.data?.id);
          return;
        }
      } catch (error: any) {
        console.warn('[EmailService] Resend exception, switching to backup SMTP:', error.message || error);
      }
    }

    // 2. Backup Engine: Nodemailer Gmail SMTP Failsafe
    try {
      const transporter = this.getSmtpTransporter();
      await transporter.sendMail({
        from: `"RopeWallet" <${process.env.SMTP_USER || 'ropewallet.official@gmail.com'}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EmailService] Delivered email via Backup SMTP to ${to}`);
    } catch (smtpErr: any) {
      console.error('[EmailService] Backup SMTP error:', smtpErr);
      throw smtpErr;
    }
  }

  static async sendOtpEmail(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'RopeWallet OTP Verification Code',
      text: `Welcome to RopeWallet!\n\nYour 6-digit OTP verification code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4F46E5; text-align: center; margin-bottom: 24px;">Welcome to RopeWallet</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">To complete your registration, please verify your email address. Your 6-digit OTP verification code is:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">This code will expire in 5 minutes. If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  static async sendForgotPasswordEmail(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'RopeWallet Password Reset Request',
      text: `RopeWallet Password Reset Request\n\nYour 6-digit OTP code to reset your password is: ${code}\n\nThis code will expire in 5 minutes. If you did not make this request, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4F46E5; text-align: center; margin-bottom: 24px;">Reset Password</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">We received a request to reset your password. Use the following 6-digit OTP code to complete the verification:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">This code will expire in 5 minutes. If you did not make this request, please ignore this email.</p>
        </div>
      `,
    });
  }

  static async sendNewDeviceOtpEmail(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Security Alert: New Device Verification Code - RopeWallet',
      text: `Security Alert: New Device Sign-In Attempt on RopeWallet\n\nYour 6-digit verification code is: ${code}\n\nThis code will expire in 10 minutes. If you did NOT attempt to log in from a new device, please change your password immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #FEF2F2; color: #EF4444; font-size: 24px; font-weight: bold;">!</div>
          </div>
          <h2 style="color: #0F172A; text-align: center; margin-bottom: 12px; font-size: 20px;">New Device Sign-In Attempt</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">We detected a sign-in attempt to your RopeWallet account from a new or unrecognized device.</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center; margin-top: 10px;">Please enter the 6-digit verification code below on your new device to approve this sign-in:</p>
          
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0F172A; font-family: monospace;">${code}</span>
          </div>

          <p style="font-size: 12px; color: #64748B; text-align: center; line-height: 1.5;">This code will expire in 10 minutes. If you did NOT attempt to log in from a new device, please change your password immediately to secure your account.</p>
        </div>
      `,
    });
  }

  static async sendPinChangeOtpEmail(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Security Alert: Transaction PIN Change OTP - RopeWallet',
      text: `RopeWallet Transaction PIN Change Request\n\nYour 6-digit OTP code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this PIN change, please secure your account immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #ECFDF5; color: #10B981; font-size: 24px; font-weight: bold;">🔑</div>
          </div>
          <h2 style="color: #0F172A; text-align: center; margin-bottom: 12px; font-size: 20px;">Transaction PIN Change Request</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">You requested to change your 6-digit Transaction PIN on RopeWallet.</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center; margin-top: 10px;">Your 6-digit OTP verification code is:</p>
          
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0F172A; font-family: monospace;">${code}</span>
          </div>

          <p style="font-size: 12px; color: #64748B; text-align: center; line-height: 1.5;">This code will expire in 5 minutes. If you did not request this PIN change, please secure your account immediately.</p>
        </div>
      `,
    });
  }

  static async sendPasswordChangeOtpEmail(email: string, code: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Security Alert: Password Change OTP - RopeWallet',
      text: `RopeWallet Password Change Request\n\nYour 6-digit OTP code is: ${code}\n\nThis code will expire in 5 minutes. If you did not request this password change, please contact support immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #EEF2FF; color: #4F46E5; font-size: 24px; font-weight: bold;">🔒</div>
          </div>
          <h2 style="color: #0F172A; text-align: center; margin-bottom: 12px; font-size: 20px;">Password Change Request</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center;">You requested to change your account password on RopeWallet.</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; text-align: center; margin-top: 10px;">Your 6-digit OTP verification code is:</p>
          
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0F172A; font-family: monospace;">${code}</span>
          </div>

          <p style="font-size: 12px; color: #64748B; text-align: center; line-height: 1.5;">This code will expire in 5 minutes. If you did not request this password change, please contact support immediately.</p>
        </div>
      `,
    });
  }
}
