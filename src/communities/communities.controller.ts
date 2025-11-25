import { Controller, Get, Post, Body, UseGuards, Req, Param, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('image', { storage }))
  create(
    @Req() req,
    @Body() body: any,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.userId;
    const { name, description, topic } = body;
    const imagePath = file ? `/uploads/communities/${file.filename}` : null;
    
    console.log('Create community - name:', name, 'description:', description, 'imagePath:', imagePath);
    
    return this.communitiesService.create(name, description, userId, imagePath, topic);
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
  @UseInterceptors(FileInterceptor('image', { storage }))
  update(
    @Param('id') id: string,
    @Req() req,
    @Body() body: { name: string; description: string; topic?: string | null },
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.userId;
    const imagePath = file ? `/uploads/communities/${file.filename}` : undefined;
    return this.communitiesService.update(
      id,
      userId,
      body.name,
      body.description,
      imagePath,
      body.topic,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    return this.communitiesService.delete(id, userId);
  }
}
