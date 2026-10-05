import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@examproject/shared-types";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { TopicsService } from "./topics.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { UpdateTopicDto } from "./dto/update-topic.dto";

@ApiTags("topics")
@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Public()
  @Get("exam-versions/:examVersionId/topics")
  findTree(
    @Param("examVersionId") examVersionId: string,
    @Query("includeArchived") includeArchived?: string,
  ) {
    return this.topicsService.findTree(examVersionId, includeArchived === "true");
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get("topics/:id")
  findOne(@Param("id") id: string) {
    return this.topicsService.findById(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post("topics")
  create(@Body() dto: CreateTopicDto, @CurrentUser() user: CurrentUserPayload) {
    return this.topicsService.create(dto, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch("topics/:id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.topicsService.update(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post("topics/:id/archive")
  archive(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.topicsService.archive(id, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete("topics/:id")
  remove(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.topicsService.remove(id, user.userId);
  }
}
