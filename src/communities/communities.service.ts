import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../users/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(
    name: string,
    description: string,
    ownerId: string,
    image?: string | null,
    topic?: string | null,
  ) {
    try {
      console.log('Creating community with:', { name, description, ownerId, image, topic });
      return await this.prisma.community.create({
        data: { 
          name, 
          description, 
          ownerId,
          image: image || null,
          topic: topic || null,
          memberCount: 1,
        } as any,
      });
    } catch (err) {
      console.error('Community creation failed:', err);
      throw new InternalServerErrorException('Could not create community');
    }
  }

  async findAll() {
    try {
      return await this.prisma.community.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (err) {
      console.error('Failed to fetch communities:', err);
      throw new InternalServerErrorException('Could not fetch communities');
    }
  }

  async findById(id: string) {
    try {
      const community = await this.prisma.community.findUnique({
        where: { id },
      });

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      return community;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error('Failed to fetch community:', err);
      throw new InternalServerErrorException('Could not fetch community');
    }
  }

  async update(
    id: string,
    ownerId: string,
    name: string,
    description: string,
    image?: string,
    topic?: string | null,
  ) {
    try {
      const community = await this.prisma.community.findUnique({
        where: { id },
      });

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      if ((community as any).ownerId !== ownerId) {
        throw new InternalServerErrorException('Only community owner can update');
      }

      const updateData: any = { name, description };
      if (image !== undefined) {
        updateData.image = image;
      }
      if (topic !== undefined) {
        updateData.topic = topic;
      }

      return await this.prisma.community.update({
        where: { id },
        data: updateData,
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      console.error('Failed to update community:', err);
      throw new InternalServerErrorException('Could not update community');
    }
  }

  async delete(id: string, ownerId: string) {
    try {
      console.log(`Delete request - Community ID: ${id}, User ID: ${ownerId}`);
      
      const community = await this.prisma.community.findUnique({
        where: { id },
      });

      if (!community) {
        console.error(`Community not found: ${id}`);
        throw new NotFoundException('Community not found');
      }

      console.log(`Community found - Owner: ${(community as any).ownerId}, Requester: ${ownerId}`);

      if ((community as any).ownerId !== ownerId) {
        console.error(`Unauthorized delete attempt - Owner: ${(community as any).ownerId}, Requester: ${ownerId}`);
        throw new InternalServerErrorException('Only community owner can delete');
      }

      const deleted = await this.prisma.community.delete({
        where: { id },
      });
      
      console.log(`Community deleted successfully: ${id}`);
      return deleted;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof InternalServerErrorException) {
        throw err;
      }
      console.error('Failed to delete community:', err);
      throw new InternalServerErrorException('Could not delete community');
    }
  }
}