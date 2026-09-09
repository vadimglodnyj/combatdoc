import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { ListEpisodesQueryDto } from './dto/list-episodes-query.dto';

@Controller('episodes')
@UseGuards(JwtAuthGuard)
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Post()
  create(@Body() dto: CreateEpisodeDto, @Request() req: any) {
    return this.episodesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: ListEpisodesQueryDto) {
    return this.episodesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.episodesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEpisodeDto,
    @Request() req: any,
  ) {
    return this.episodesService.update(id, dto, req.user.id);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Request() req: any) {
    return this.episodesService.close(id, req.user.id);
  }

  @Post(':id/reopen')
  reopen(@Param('id') id: string, @Request() req: any) {
    return this.episodesService.reopen(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.episodesService.remove(id, req.user.id);
  }
}
