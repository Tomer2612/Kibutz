import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Req() req, @Body() body: { name: string; description: string }) {
    const userId = req.user.userId;
    return this.communitiesService.create(body.name, body.description, userId);
  }

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }
}
