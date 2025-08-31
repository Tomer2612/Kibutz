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

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails } = profile;
    const user = {
      email: emails[0].value,
      name: name.givenName,
      provider: 'google',
    };
    done(null, user);
  }
}
