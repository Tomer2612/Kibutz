// src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
constructor(private readonly configService: ConfigService) {
  super({
    clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
    clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
    callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
    scope: ['email', 'profile'],
  });
}

  authenticate(req: any, options: any) {
    options = options || {};
    options.prompt = 'select_account';
    super.authenticate(req, options);
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      name: name?.givenName || name?.familyName || emails[0].value.split('@')[0],
      picture: photos?.[0]?.value || null,
      provider: 'google',
    };
    done(null, user);
  }
}
