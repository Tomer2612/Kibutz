import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@kibutz.com';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const verificationLink = `${this.frontendUrl}/verify-email?token=${token}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #000; margin: 0; }
          .content { text-align: right; line-height: 1.8; }
          .button { display: inline-block; background: #000; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
          .signature { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏘️ Kibutz</h1>
          </div>
          <div class="content">
            <p>שלום ${name},</p>
            <p>תודה שבחרת להצטרף ל-Kibutz! כדי להשלים את תהליך ההרשמה ולהפעיל את החשבון, יש לאמת את כתובת המייל בלחיצה על הכפתור:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">אימות כתובת המייל</a>
            </div>
            <p>אם לא נרשמת לשירות, ניתן להתעלם מהודעה זו והפרטים שלך יימחקו מהמערכת.</p>
            <p><strong>הקישור יהיה תקף למשך 24 שעות בלבד.</strong></p>
            <p class="signature">בברכה,<br/>צוות Kibutz</p>
          </div>
          <div class="footer">
            <p>© 2025 Kibutz. כל הזכויות שמורות.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `שלום ${name},\n\nתודה שבחרת להצטרף ל-Kibutz! כדי להשלים את תהליך ההרשמה ולהפעיל את החשבון, יש לאמת את כתובת המייל בלחיצה על הקישור:\n${verificationLink}\n\nאם לא נרשמת לשירות, ניתן להתעלם מהודעה זו והפרטים שלך יימחקו מהמערכת.\nהקישור יהיה תקף למשך 24 שעות בלבד.\n\nבברכה,\nצוות Kibutz`;

    await this.sendEmail(email, 'ברוכים הבאים ל-Kibutz! אימות כתובת המייל שלך', htmlBody, textBody);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #000; margin: 0; }
          .content { text-align: right; line-height: 1.8; }
          .button { display: inline-block; background: #000; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
          .signature { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏘️ Kibutz</h1>
          </div>
          <div class="content">
            <p>שלום ${name},</p>
            <p>קיבלנו בקשה לאיפוס הסיסמה לחשבונך. כדי להגדיר סיסמה חדשה, יש ללחוץ על הכפתור למטה:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">איפוס סיסמה</a>
            </div>
            <p>אם לא ביקשת לבצע פעולה זו, ניתן להתעלם מהודעה זו והסיסמה שלך תישאר ללא שינוי.</p>
            <p><strong>שים לב:</strong> הקישור יהיה תקף למשך שעה בלבד.</p>
            <p class="signature">בברכה,<br/>צוות Kibutz</p>
          </div>
          <div class="footer">
            <p>© 2025 Kibutz. כל הזכויות שמורות.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `שלום ${name},\n\nקיבלנו בקשה לאיפוס הסיסמה לחשבונך. כדי להגדיר סיסמה חדשה, לחץ על הקישור:\n${resetLink}\n\nאם לא ביקשת לבצע פעולה זו, ניתן להתעלם מהודעה זו והסיסמה שלך תישאר ללא שינוי.\nשים לב: הקישור יהיה תקף למשך שעה בלבד.\n\nבברכה,\nצוות Kibutz`;

    await this.sendEmail(email, 'איפוס סיסמה לחשבון Kibutz שלך', htmlBody, textBody);
  }

  private async sendEmail(to: string, subject: string, htmlBody: string, textBody: string): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
    } catch (error: any) {
      console.error('Failed to send email:', error);
      // Don't throw for sandbox mode - recipient not verified
      if (error.Code === 'MessageRejected' && error.message?.includes('not verified')) {
        console.warn('SES Sandbox: Recipient email not verified. Email not sent.');
        return; // Silently fail for unverified recipients in sandbox
      }
      throw error;
    }
  }
}
