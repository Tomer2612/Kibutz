import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../users/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, name: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      console.error('Signup error:', error);
      throw new InternalServerErrorException('Signup failed');
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
    }

    return this.signToken(user.id, user.email);
  }

  async loginWithGoogle(googleUser: any) {
    // Find user by email
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // User exists - update googleId and optionally profile image
      const updateData: any = {};
      if (!user.googleId) {
        updateData.googleId = googleUser.email;
      }
      // Update profile image from Google if user doesn't have one
      if (!user.profileImage && googleUser.picture) {
        updateData.profileImage = googleUser.picture;
      }
      
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    } else {
      // Create new user with Google
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          password: '', // No password for Google users
          googleId: googleUser.email,
          profileImage: googleUser.picture || null,
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  private signToken(userId: string, email: string) {
    const payload = { sub: userId, email };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}