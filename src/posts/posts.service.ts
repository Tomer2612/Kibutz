import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../users/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(
    content: string, 
    authorId: string, 
    communityId: string, 
    title?: string, 
    image?: string,
    fileUrl?: string,
    fileName?: string,
    linkUrl?: string
  ) {
    try {
      return await this.prisma.post.create({
        data: { title, content, image, fileUrl, fileName, linkUrl, authorId, communityId },
        include: {
          author: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: { likes: true, comments: true, savedBy: true },
          },
        },
      });
    } catch (err) {
      console.error('Post creation failed:', err);
      throw new InternalServerErrorException('Could not create post');
    }
  }

  async findByCommunity(communityId: string, userId?: string) {
    const posts = await this.prisma.post.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { likes: true, comments: true, savedBy: true },
        },
        likes: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
        savedBy: userId ? {
          where: { userId },
          select: { id: true },
        } : false,
      },
    });

    // Transform to include isLiked and isSaved booleans
    return posts.map(post => ({
      ...post,
      isLiked: userId ? (post.likes as any[])?.length > 0 : false,
      isSaved: userId ? (post.savedBy as any[])?.length > 0 : false,
      likes: undefined,
      savedBy: undefined,
    }));
  }

  async update(
    postId: string, 
    content: string, 
    userId: string, 
    title?: string,
    linkUrl?: string,
    removeImage?: boolean,
    removeFile?: boolean,
    removeLink?: boolean,
    newImagePath?: string,
    newFileUrl?: string,
    newFileName?: string
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const updateData: any = { content, title };
    
    // Handle link updates
    if (linkUrl !== undefined) {
      updateData.linkUrl = linkUrl;
    }
    if (removeLink) {
      updateData.linkUrl = null;
    }
    
    // Handle image - new upload or removal
    if (newImagePath) {
      updateData.image = newImagePath;
    } else if (removeImage) {
      updateData.image = null;
    }
    
    // Handle file - new upload or removal
    if (newFileUrl) {
      updateData.fileUrl = newFileUrl;
      updateData.fileName = newFileName;
    } else if (removeFile) {
      updateData.fileUrl = null;
      updateData.fileName = null;
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { likes: true, comments: true, savedBy: true },
        },
      },
    });
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }

  // Like/Unlike toggle
  async toggleLike(postId: string, userId: string) {
    try {
      const existingLike = await this.prisma.like.findFirst({
        where: {
          userId,
          postId,
        },
      });

      if (existingLike) {
        // Unlike
        await this.prisma.like.delete({
          where: { id: existingLike.id },
        });
        return { liked: false };
      } else {
        // Like - use upsert to handle race conditions
        await this.prisma.like.upsert({
          where: {
            userId_postId: { userId, postId },
          },
          create: { userId, postId },
          update: {}, // No update needed, just ensure it exists
        });
        return { liked: true };
      }
    } catch (err) {
      console.error('Toggle like error:', err);
      // If there was a race condition and like already exists, treat as success
      if (err.code === 'P2002') {
        return { liked: true };
      }
      throw err;
    }
  }

  // Get comments for a post
  async getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  // Create a comment
  async createComment(postId: string, userId: string, content: string) {
    return this.prisma.comment.create({
      data: { postId, userId, content },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  // Delete a comment
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted successfully' };
  }

  // Edit a comment
  async editComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  // Save/Unsave toggle
  async toggleSave(postId: string, userId: string) {
    try {
      const existingSave = await this.prisma.savedPost.findFirst({
        where: {
          userId,
          postId,
        },
      });

      if (existingSave) {
        // Unsave
        await this.prisma.savedPost.delete({
          where: { id: existingSave.id },
        });
        return { saved: false };
      } else {
        // Save - use upsert to handle race conditions
        await this.prisma.savedPost.upsert({
          where: {
            userId_postId: { userId, postId },
          },
          create: { userId, postId },
          update: {},
        });
        return { saved: true };
      }
    } catch (err) {
      console.error('Toggle save error:', err);
      if (err.code === 'P2002') {
        return { saved: true };
      }
      throw err;
    }
  }
}
