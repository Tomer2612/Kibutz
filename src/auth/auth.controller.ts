import { Controller, Post, Body, Get, Req, Res, UseGuards, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class AuthController {
  private frontendUrl: string;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  @Post('signup')
  signup(@Body() body: { email: string; name: string; password: string }) {
    console.log('Received signup body:', body);
    return this.authService.signup(body.email, body.name, body.password);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    console.log('Received login body:', body);
    return this.authService.login(body.email, body.password);
  }

  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return { exists };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {

  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    try {
      const token = await this.authService.loginWithGoogle(req.user);
      res.redirect(`${this.frontendUrl}/google-success?token=${token}`);
    } catch (error) {
      if (error.message === 'ACCOUNT_EXISTS_USE_PASSWORD') {
        // User exists with email/password, redirect to login with message
        res.redirect(`${this.frontendUrl}/login?error=account_exists`);
      } else {
        res.redirect(`${this.frontendUrl}/login?error=google_failed`);
      }
    }
  }

  // Email verification endpoints
  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  // Password reset endpoints
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}