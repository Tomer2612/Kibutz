import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async findById(id: string) {
    // Try to find by ID first, then by email (for legacy tokens)
    let user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        googleId: true,
      },
    });
    
    // If not found by ID, try by email (handles old tokens with email as sub)
    if (!user && id.includes('@')) {
      user = await this.prisma.user.findUnique({
        where: { email: id },
        select: {
          id: true,
          email: true,
          name: true,
          profileImage: true,
          googleId: true,
        },
      });
    }
    
    return user;
  }

  async findByIdOrEmail(idOrEmail: string) {
    // First try by ID
    let user = await this.prisma.user.findUnique({
      where: { id: idOrEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        profileImage: true,
        googleId: true,
        showOnline: true,
      },
    });
    
    // If not found, try by email
    if (!user && idOrEmail.includes('@')) {
      user = await this.prisma.user.findUnique({
        where: { email: idOrEmail },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          profileImage: true,
          googleId: true,
          showOnline: true,
        },
      });
    }
    
    return user;
  }

  async updateProfile(userId: string, name?: string, profileImage?: string) {
    // Find user by ID or email first
    const user = await this.findByIdOrEmail(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const data: any = {};
    if (name) data.name = name;
    if (profileImage) data.profileImage = profileImage;

    return this.prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        googleId: true,
      },
    });
  }

  async disconnectGoogle(userId: string) {
    // Find user by ID or email first
    const user = await this.findByIdOrEmail(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { googleId: null },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        googleId: true,
      },
    });
  }

  async toggleOnlineStatus(userId: string, showOnline: boolean) {
    const user = await this.findByIdOrEmail(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { showOnline },
      select: {
        id: true,
        showOnline: true,
      },
    });
  }

  async getOnlineStatus(userId: string) {
    const user = await this.findByIdOrEmail(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { showOnline: user.showOnline ?? true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: userId },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.findByIdOrEmail(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Delete user - cascade will handle related records
    await this.prisma.user.delete({
      where: { id: user.id },
    });

    return { message: 'Account deleted successfully' };
  }
}
