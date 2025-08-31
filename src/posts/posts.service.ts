import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../users/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(content: string, authorId: string, communityId: string) {
    try {
      return await this.prisma.post.create({
        data: { content, authorId, communityId },
      });
    } catch (err) {
      console.error('Post creation failed:', err);
      throw new InternalServerErrorException('Could not create post');
    }
  }

  async findByCommunity(communityId: string) {
    return this.prisma.post.findMany({
      where: { communityId },
      include: {
        author: {
          select: { email: true },
        },
      },
    });
  }
}
