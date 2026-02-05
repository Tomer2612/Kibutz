import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@withly.co.il';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
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
            <h1>🏘️ Withly</h1>
          </div>
          <div class="content">
            <p>שלום ${name},</p>
            <p>תודה שבחרת להצטרף ל-Withly! כדי להשלים את תהליך ההרשמה ולהפעיל את החשבון, יש לאמת את כתובת המייל בלחיצה על הכפתור:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">אימות כתובת המייל</a>
            </div>
            <p>אם לא נרשמת לשירות, ניתן להתעלם מהודעה זו והפרטים שלך יימחקו מהמערכת.</p>
            <p><strong>הקישור יהיה תקף למשך 24 שעות בלבד.</strong></p>
            <p class="signature">בברכה,<br/>צוות Withly</p>
          </div>
          <div class="footer">
            <p>© 2025 Withly. כל הזכויות שמורות.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `שלום ${name},\n\nתודה שבחרת להצטרף ל-Withly! כדי להשלים את תהליך ההרשמה ולהפעיל את החשבון, יש לאמת את כתובת המייל בלחיצה על הקישור:\n${verificationLink}\n\nאם לא נרשמת לשירות, ניתן להתעלם מהודעה זו והפרטים שלך יימחקו מהמערכת.\nהקישור יהיה תקף למשך 24 שעות בלבד.\n\nבברכה,\nצוות Withly`;

    await this.sendEmail(email, 'ברוכים הבאים ל-Withly! אימות כתובת המייל שלך', htmlBody, textBody);
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
            <h1>🏘️ Withly</h1>
          </div>
          <div class="content">
            <p>שלום ${name},</p>
            <p>קיבלנו בקשה לאיפוס הסיסמה לחשבונך. כדי להגדיר סיסמה חדשה, יש ללחוץ על הכפתור למטה:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">איפוס סיסמה</a>
            </div>
            <p>אם לא ביקשת לבצע פעולה זו, ניתן להתעלם מהודעה זו והסיסמה שלך תישאר ללא שינוי.</p>
            <p><strong>שים לב:</strong> הקישור יהיה תקף למשך שעה בלבד.</p>
            <p class="signature">בברכה,<br/>צוות Withly</p>
          </div>
          <div class="footer">
            <p>© 2025 Withly. כל הזכויות שמורות.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `שלום ${name},\n\nקיבלנו בקשה לאיפוס הסיסמה לחשבונך. כדי להגדיר סיסמה חדשה, לחץ על הקישור:\n${resetLink}\n\nאם לא ביקשת לבצע פעולה זו, ניתן להתעלם מהודעה זו והסיסמה שלך תישאר ללא שינוי.\nשים לב: הקישור יהיה תקף למשך שעה בלבד.\n\nבברכה,\nצוות Withly`;

    await this.sendEmail(email, 'איפוס סיסמה לחשבון Withly שלך', htmlBody, textBody);
  }

  async sendContactEmail(name: string, email: string, subject: string, message: string): Promise<void> {
    const supportEmail = 'support@withly.co.il';
    
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
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #333; }
          .value { color: #666; }
          .message-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 פנייה חדשה מטופס יצירת קשר</h1>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">שם:</span>
              <span class="value">${name}</span>
            </div>
            <div class="field">
              <span class="label">אימייל:</span>
              <span class="value">${email}</span>
            </div>
            <div class="field">
              <span class="label">נושא:</span>
              <span class="value">${subject}</span>
            </div>
            <div class="field">
              <span class="label">הודעה:</span>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <div class="footer">
            <p>הודעה זו נשלחה מטופס יצירת קשר באתר Withly</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `פנייה חדשה מטופס יצירת קשר\n\nשם: ${name}\nאימייל: ${email}\nנושא: ${subject}\n\nהודעה:\n${message}`;

    await this.sendEmail(supportEmail, `צור קשר: ${subject}`, htmlBody, textBody);
  }

  private async sendEmail(to: string, subject: string, htmlBody: string, textBody: string): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: subject,
        html: htmlBody,
        text: textBody,
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
}
