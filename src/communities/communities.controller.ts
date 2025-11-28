import { Controller, Get, Post, Body, UseGuards, Req, Param, Put, Delete, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CommunitiesService } from './communities.service';
import { AuthGuard } from '@nestjs/passport';

// Configure multer storage
const storage = diskStorage({
  destination: './uploads/communities',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 },
  ], { storage }))
  create(
    @Req() req,
    @Body() body: any,
    @UploadedFiles() files?: { image?: any[]; galleryImages?: any[] },
  ) {
    const userId = req.user.userId;
    const { name, description, topic, youtubeUrl, whatsappUrl, facebookUrl, instagramUrl } = body;
    const imagePath = files?.image?.[0] ? `/uploads/communities/${files.image[0].filename}` : null;
    const galleryPaths = files?.galleryImages?.map(f => `/uploads/communities/${f.filename}`) || [];
    
    console.log('Create community - name:', name, 'description:', description, 'imagePath:', imagePath);
    
    return this.communitiesService.create(
      name, 
      description, 
      userId, 
      imagePath, 
      topic,
      youtubeUrl,
      whatsappUrl,
      facebookUrl,
      instagramUrl,
      galleryPaths,
    );
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communitiesService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 },
  ], { storage }))
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() body: { 
      name: string; 
      description: string; 
      topic?: string | null; 
      removeImage?: string;
      youtubeUrl?: string;
      whatsappUrl?: string;
      facebookUrl?: string;
      instagramUrl?: string;
      existingGalleryImages?: string;
      existingPrimaryImage?: string;
    },
    @UploadedFiles() files?: { image?: any[]; galleryImages?: any[] },
  ) {
    const userId = req.user.userId;
    let imagePath: string | null | undefined = undefined;
    
    if (files?.image?.[0]) {
      // New image uploaded
      imagePath = `/uploads/communities/${files.image[0].filename}`;
    } else if (body.existingPrimaryImage) {
      // Keep existing primary image (don't change it)
      imagePath = body.existingPrimaryImage;
    } else if (body.removeImage === 'true') {
      // Remove image
      imagePath = null;
    }
    
    const newGalleryPaths = files?.galleryImages?.map(f => `/uploads/communities/${f.filename}`) || [];
    const existingGallery = body.existingGalleryImages ? JSON.parse(body.existingGalleryImages) : [];
    const galleryImages = [...existingGallery, ...newGalleryPaths];
    
    return this.communitiesService.update(
      id,
      userId,
      body.name,
      body.description,
      imagePath,
      body.topic,
      body.youtubeUrl,
      body.whatsappUrl,
      body.facebookUrl,
      body.instagramUrl,
      galleryImages,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.delete(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/join')
  join(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.joinCommunity(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/leave')
  leave(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.leaveCommunity(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/membership')
  checkMembership(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.checkMembership(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/members/:memberId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'MANAGER' | 'USER' },
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.communitiesService.updateMemberRole(id, memberId, body.role, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.communitiesService.removeMember(id, memberId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/memberships')
  getUserMemberships(@Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.getUserMemberships(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/members')
  getCommunityMembers(@Param('id') id: string) {
    return this.communitiesService.getCommunityMembers(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/banned')
  getBannedUsers(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.getBannedUsers(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/banned/:oderId')
  liftBan(@Param('id') id: string, @Param('oderId') oderId: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.liftBan(id, oderId, userId);
  }

  @Get(':id/managers')
  getCommunityManagers(@Param('id') id: string) {
    return this.communitiesService.getCommunityManagers(id);
  }

  @Get(':id/online-count')
  getOnlineMembersCount(@Param('id') id: string) {
    return this.communitiesService.getOnlineMembersCount(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/top-members')
  getTopMembers(@Param('id') id: string) {
    return this.communitiesService.getTopMembers(id, 3);
  }
}
