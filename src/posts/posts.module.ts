import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [PostsService],
  controllers: [PostsController],
  imports: [UsersModule]
})
export class PostsModule {}
