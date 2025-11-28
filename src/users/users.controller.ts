import { Controller, Get, Post, Patch, Delete, UseGuards, Req, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

const storage = diskStorage({
  destination: './uploads/profiles',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Req() req) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      profileImage: user?.profileImage,
      googleConnected: !!user?.googleId,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  @UseInterceptors(FileInterceptor('profileImage', { storage }))
  async updateProfile(
    @Req() req,
    @Body() body: { name?: string },
    @UploadedFile() file?: any,
  ) {
    const profileImage = file ? `/uploads/profiles/${file.filename}` : undefined;
    const user = await this.usersService.updateProfile(req.user.userId, body.name, profileImage);
    return {
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      profileImage: user?.profileImage,
      googleConnected: !!user?.googleId,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me/google')
  async disconnectGoogle(@Req() req) {
    const user = await this.usersService.disconnectGoogle(req.user.userId);
    return {
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      profileImage: user?.profileImage,
      googleConnected: !!user?.googleId,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/online-status')
  async getOnlineStatus(@Req() req) {
    return this.usersService.getOnlineStatus(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/online-status')
  async toggleOnlineStatus(@Req() req, @Body() body: { showOnline: boolean }) {
    return this.usersService.toggleOnlineStatus(req.user.userId, body.showOnline);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/password')
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    await this.usersService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
    return { message: 'Password changed successfully' };
  }
}
