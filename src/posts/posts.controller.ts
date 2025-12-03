import { Controller, Post, Body, Param, UseGuards, Req, Get, Delete, Patch, Query, UseInterceptors, UploadedFiles, Res, StreamableFile } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
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
  @UseInterceptors(FilesInterceptor('files', 10, { storage })) // Max 5 images + 5 files = 10
  createPost(
    @Param('communityId') communityId: string,
    @Req() req,
    @Body() body: { content: string; title?: string; links?: string; category?: string },
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const userId = req.user.userId;
    
    const images: string[] = [];
    const uploadedFiles: { url: string; name: string }[] = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `/uploads/posts/${file.filename}`;
        const fileType = getFileType(file.mimetype);
        
        if (fileType === 'image' && images.length < 5) {
          images.push(filePath);
        } else if (fileType === 'file' && uploadedFiles.length < 5) {
          uploadedFiles.push({ url: filePath, name: file.originalname });
        }
      }
    }
    
    // Parse links from JSON string
    let links: string[] = [];
    if (body.links) {
      try {
        links = JSON.parse(body.links);
        if (Array.isArray(links)) {
          links = links.slice(0, 10); // Limit to 10 links
        } else {
          links = [];
        }
      } catch {
        links = [];
      }
    }
    
    return this.postsService.create(
      body.content, 
      userId, 
      communityId, 
      body.title, 
      images.length > 0 ? images : undefined,
      uploadedFiles.length > 0 ? uploadedFiles : undefined,
      links.length > 0 ? links : undefined,
      body.category
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
  @UseInterceptors(FilesInterceptor('files', 10, { storage })) // Max 5 images + 5 files = 10
  updatePost(
    @Param('postId') postId: string,
    @Req() req,
    @Body() body: { 
      content: string; 
      title?: string; 
      links?: string;
      imagesToRemove?: string;
      filesToRemove?: string;
      linksToRemove?: string;
    },
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const userId = req.user.userId;
    
    const newImages: string[] = [];
    const newFiles: { url: string; name: string }[] = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `/uploads/posts/${file.filename}`;
        const fileType = getFileType(file.mimetype);
        
        if (fileType === 'image' && newImages.length < 5) {
          newImages.push(filePath);
        } else if (fileType === 'file' && newFiles.length < 5) {
          newFiles.push({ url: filePath, name: file.originalname });
        }
      }
    }
    
    // Parse arrays from JSON strings
    let links: string[] | undefined;
    let imagesToRemove: string[] | undefined;
    let filesToRemove: string[] | undefined;
    let linksToRemove: string[] | undefined;
    
    try {
      if (body.links) links = JSON.parse(body.links);
      if (body.imagesToRemove) imagesToRemove = JSON.parse(body.imagesToRemove);
      if (body.filesToRemove) filesToRemove = JSON.parse(body.filesToRemove);
      if (body.linksToRemove) linksToRemove = JSON.parse(body.linksToRemove);
    } catch {
      // Ignore parse errors
    }
    
    return this.postsService.update(
      postId, 
      body.content, 
      userId, 
      body.title, 
      newImages.length > 0 ? newImages : undefined,
      newFiles.length > 0 ? newFiles : undefined,
      links,
      imagesToRemove,
      filesToRemove,
      linksToRemove
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

  // Pin/Unpin a post (owner/manager only)
  @UseGuards(AuthGuard('jwt'))
  @Post(':postId/pin')
  togglePin(@Param('postId') postId: string, @Req() req) {
    const userId = req.user.userId;
    return this.postsService.togglePin(postId, userId);
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
