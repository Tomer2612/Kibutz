import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../users/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, description: string, ownerId: string) {
    try {
      return await this.prisma.community.create({
        data: { name, description, ownerId },
      });
    } catch (err) {
      console.error('Community creation failed:', err);
      throw new InternalServerErrorException('Could not create community');
    }
  }

  async findAll() {
    return this.prisma.community.findMany({
      include: {
        owner: {
          select: { email: true },
        },
      },
    });
  }
}