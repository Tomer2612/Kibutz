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
    images?: string[],
    files?: { url: string; name: string }[],
    links?: string[],
    category?: string
  ) {
    try {
      return await this.prisma.post.create({
        data: { 
          title, 
          content, 
          images: images || [],
          files: files || [],
          links: links || [],
          category,
          authorId, 
          communityId 
        },
        include: {
          author: {
            select: { id: true, email: true, name: true, profileImage: true },
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
      orderBy: [
        { isPinned: 'desc' },  // Pinned posts first
        { pinnedAt: 'desc' },  // Most recently pinned first among pinned
        { createdAt: 'desc' }, // Then by creation date
      ],
      include: {
        author: {
          select: { id: true, email: true, name: true, profileImage: true },
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
    images?: string[],
    files?: { url: string; name: string }[],
    links?: string[],
    imagesToRemove?: string[],
    filesToRemove?: string[],
    linksToRemove?: string[]
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
    
    // Handle images - add new ones and remove specified
    if (images || imagesToRemove) {
      const currentImages = (post.images as string[]) || [];
      let newImages = [...currentImages];
      
      // Remove specified images
      if (imagesToRemove && imagesToRemove.length > 0) {
        newImages = newImages.filter(img => !imagesToRemove.includes(img));
      }
      
      // Add new images (up to limit of 5)
      if (images && images.length > 0) {
        newImages = [...newImages, ...images].slice(0, 5);
      }
      
      updateData.images = newImages;
    }
    
    // Handle files - add new ones and remove specified
    if (files || filesToRemove) {
      const currentFiles = (post.files as { url: string; name: string }[]) || [];
      let newFiles = [...currentFiles];
      
      // Remove specified files
      if (filesToRemove && filesToRemove.length > 0) {
        newFiles = newFiles.filter(file => !filesToRemove.includes(file.url));
      }
      
      // Add new files (up to limit of 5)
      if (files && files.length > 0) {
        newFiles = [...newFiles, ...files].slice(0, 5);
      }
      
      updateData.files = newFiles;
    }
    
    // Handle links - add new ones and remove specified
    if (links || linksToRemove) {
      const currentLinks = (post.links as string[]) || [];
      let newLinks = [...currentLinks];
      
      // Remove specified links
      if (linksToRemove && linksToRemove.length > 0) {
        newLinks = newLinks.filter(link => !linksToRemove.includes(link));
      }
      
      // Add new links (up to limit of 10)
      if (links && links.length > 0) {
        newLinks = [...newLinks, ...links].slice(0, 10);
      }
      
      updateData.links = newLinks;
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: { id: true, email: true, name: true, profileImage: true },
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
          select: { id: true, email: true, name: true, profileImage: true },
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
          select: { id: true, email: true, name: true, profileImage: true },
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
          select: { id: true, email: true, name: true, profileImage: true },
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

  // Pin/Unpin a post (owner/manager only)
  async togglePin(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { community: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is owner or manager of the community
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId: post.communityId },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
      throw new ForbiddenException('Only owners and managers can pin posts');
    }

    // Toggle pin status
    const newPinStatus = !post.isPinned;
    
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        isPinned: newPinStatus,
        pinnedAt: newPinStatus ? new Date() : null,
      },
      include: {
        author: {
          select: { id: true, email: true, name: true, profileImage: true },
        },
        _count: {
          select: { likes: true, comments: true, savedBy: true },
        },
      },
    });
  }

  async getLinkPreview(url: string) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Kibutz/1.0; +http://kibutz.com)',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch URL');
      }
      
      const html = await response.text();
      
      // Extract Open Graph meta tags
      const getMetaContent = (property: string): string | null => {
        const match = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')) 
          || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'));
        return match ? match[1] : null;
      };
      
      const getMetaName = (name: string): string | null => {
        const match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
          || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'));
        return match ? match[1] : null;
      };
      
      // Get title
      let title = getMetaContent('og:title') || getMetaName('twitter:title');
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = titleMatch ? titleMatch[1].trim() : null;
      }
      
      // Get description
      const description = getMetaContent('og:description') || getMetaName('description') || getMetaName('twitter:description');
      
      // Get image
      let image = getMetaContent('og:image') || getMetaName('twitter:image');
      if (image && !image.startsWith('http')) {
        const urlObj = new URL(url);
        image = image.startsWith('/') ? `${urlObj.origin}${image}` : `${urlObj.origin}/${image}`;
      }
      
      return {
        url,
        title: title || new URL(url).hostname,
        description: description || null,
        image: image || null,
      };
    } catch (err) {
      console.error('Link preview error:', err);
      // Return basic fallback
      try {
        const urlObj = new URL(url);
        return {
          url,
          title: urlObj.hostname.replace('www.', ''),
          description: null,
          image: null,
        };
      } catch {
        return { url, title: url, description: null, image: null };
      }
    }
  }
}
