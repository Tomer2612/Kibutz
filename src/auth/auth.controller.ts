import { Controller, Post, Body, Get, Req, Res, UseGuards, Param, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

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
    const token = await this.authService.loginWithGoogle(req.user);
    res.redirect(`http://localhost:3000/google-success?token=${token}`);
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