import { Controller, Post, Body, Param, UseGuards, Req, Get } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':communityId')
  createPost(
    @Param('communityId') communityId: string,
    @Req() req,
    @Body() body: { content: string }
  ) {
    const userId = req.user.userId;
    return this.postsService.create(body.content, userId, communityId);
  }

  @Get(':communityId')
  getPosts(@Param('communityId') communityId: string) {
    return this.postsService.findByCommunity(communityId);
  }
}
