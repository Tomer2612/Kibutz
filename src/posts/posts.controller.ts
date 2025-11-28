import { Controller, Post, Body, Param, UseGuards, Req, Get, Delete, Patch, Query, UseInterceptors, UploadedFile, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Multer } from 'multer';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { PostsService } from './posts.service';
import { AuthGuard } from '@nestjs/passport';

const storage = diskStorage({
  destination: './uploads/posts',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

// File filter to determine file type
const getFileType = (mimetype: string): 'image' | 'file' => {
  if (mimetype.startsWith('image/')) return 'image';
  return 'file';
};

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // Get posts by community - must come before :postId routes
  @Get('community/:communityId')
  getPosts(
    @Param('communityId') communityId: string,
    @Query('userId') userId?: string
  ) {
    return this.postsService.findByCommunity(communityId, userId);
  }

  // Create post in community
  @UseGuards(AuthGuard('jwt'))
  @Post('community/:communityId')
  @UseInterceptors(FileInterceptor('file', { storage }))
  createPost(
    @Param('communityId') communityId: string,
    @Req() req,
    @Body() body: { content: string; title?: string; linkUrl?: string },
    @UploadedFile() file?: Multer.File
  ) {
    const userId = req.user.userId;
    
    let imagePath: string | undefined;
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    
    if (file) {
      const filePath = `/uploads/posts/${file.filename}`;
      const fileType = getFileType(file.mimetype);
      
      if (fileType === 'image') {
        imagePath = filePath;
      } else {
        fileUrl = filePath;
        fileName = file.originalname;
      }
    }
    
    return this.postsService.create(
      body.content, 
      userId, 
      communityId, 
      body.title, 
      imagePath,
      fileUrl,
      fileName,
      body.linkUrl
    );
  }

  // Delete a comment - specific route before generic :postId
  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @Req() req) {
    const userId = req.user.userId;
    return this.postsService.deleteComment(commentId, userId);
  }

  // Edit a comment
  @UseGuards(AuthGuard('jwt'))
  @Patch('comments/:commentId')
  editComment(
    @Param('commentId') commentId: string,
    @Req() req,
    @Body() body: { content: string }
  ) {
    const userId = req.user.userId;
    return this.postsService.editComment(commentId, userId, body.content);
  }

  // Update a post
  @UseGuards(AuthGuard('jwt'))
  @Patch(':postId')
  @UseInterceptors(FileInterceptor('file', { storage }))
  updatePost(
    @Param('postId') postId: string,
    @Req() req,
    @Body() body: { content: string; title?: string; linkUrl?: string; removeImage?: string; removeFile?: string; removeLink?: string },
    @UploadedFile() file?: Multer.File
  ) {
    const userId = req.user.userId;
    
    let newImagePath: string | undefined;
    let newFileUrl: string | undefined;
    let newFileName: string | undefined;
    
    if (file) {
      const filePath = `/uploads/posts/${file.filename}`;
      const fileType = getFileType(file.mimetype);
      
      if (fileType === 'image') {
        newImagePath = filePath;
      } else {
        newFileUrl = filePath;
        newFileName = file.originalname;
      }
    }
    
    return this.postsService.update(
      postId, 
      body.content, 
      userId, 
      body.title, 
      body.linkUrl, 
      body.removeImage === 'true',
      body.removeFile === 'true',
      body.removeLink === 'true',
      newImagePath,
      newFileUrl,
      newFileName
    );
  }

  // Delete a post
  @UseGuards(AuthGuard('jwt'))
  @Delete(':postId')
  deletePost(@Param('postId') postId: string, @Req() req) {
    const userId = req.user.userId;
    return this.postsService.delete(postId, userId);
  }

  // Like/Unlike toggle
  @UseGuards(AuthGuard('jwt'))
  @Post(':postId/like')
  toggleLike(@Param('postId') postId: string, @Req() req) {
    const userId = req.user.userId;
    return this.postsService.toggleLike(postId, userId);
  }

  // Save/Unsave toggle
  @UseGuards(AuthGuard('jwt'))
  @Post(':postId/save')
  toggleSave(@Param('postId') postId: string, @Req() req) {
    const userId = req.user.userId;
    return this.postsService.toggleSave(postId, userId);
  }

  // Get comments for a post
  @Get(':postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.postsService.getComments(postId);
  }

  // Create a comment
  @UseGuards(AuthGuard('jwt'))
  @Post(':postId/comments')
  createComment(
    @Param('postId') postId: string,
    @Req() req,
    @Body() body: { content: string }
  ) {
    const userId = req.user.userId;
    return this.postsService.createComment(postId, userId, body.content);
  }
}
