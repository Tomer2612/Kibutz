import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunitiesModule } from '../communities/communities.module';

@Module({
  providers: [PostsService],
  controllers: [PostsController],
  imports: [UsersModule, NotificationsModule, CommunitiesModule]
})
export class PostsModule {}
