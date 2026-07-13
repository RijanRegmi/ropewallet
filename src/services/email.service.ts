import nodemailer from 'nodemailer';

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    // If port is 465, use secure SSL/TLS. Otherwise STARTTLS (e.g. 587)
    const secure = port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
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
}
