import nodemailer from 'nodemailer';

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    const isGmail = host.toLowerCase().includes('gmail') || user.toLowerCase().includes('gmail');
    const secure = port === 465;

    return nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          }
        : {
            host,
            port,
            secure,
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          }
    );
  }

  static async sendOtpEmail(email: string, code: string): Promise<void> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || 'RopeWallet <noreply@ropewallet.com>';

    const mailOptions = {
      from,
      to: email,
      subject: 'RopeWallet OTP Verification Code',
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
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendForgotPasswordEmail(email: string, code: string): Promise<void> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || 'RopeWallet <noreply@ropewallet.com>';

    const mailOptions = {
      from,
      to: email,
      subject: 'RopeWallet Password Reset Request',
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
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendNewDeviceOtpEmail(email: string, code: string): Promise<void> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || 'RopeWallet Security <noreply@ropewallet.com>';

    const mailOptions = {
      from,
      to: email,
      subject: 'Security Alert: New Device Verification Code - RopeWallet',
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
    };

    await transporter.sendMail(mailOptions);
  }
}
