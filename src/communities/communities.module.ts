import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../users/prisma.service';

@Module({
  providers: [CommunitiesService, PrismaService],
  controllers: [CommunitiesController],
  imports: [UsersModule],
})
export class CommunitiesModule {}
