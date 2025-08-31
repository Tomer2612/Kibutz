import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [CommunitiesService],
  controllers: [CommunitiesController],
  imports: [UsersModule]
})
export class CommunitiesModule {}
