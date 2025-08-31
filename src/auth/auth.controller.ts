import { Controller, Post, Body, Get, Req, Res, UseGuards } from '@nestjs/common';
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
}