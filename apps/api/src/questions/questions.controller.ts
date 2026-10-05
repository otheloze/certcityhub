import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { QuestionStatus, QuestionType, Role } from "@examproject/shared-types";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { MapTopicDto } from "./dto/map-topic.dto";

@ApiTags("questions")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  find(
    @Query("status") status?: QuestionStatus,
    @Query("type") type?: QuestionType,
    @Query("examId") examId?: string,
    @Query("examVersionId") examVersionId?: string,
    @Query("topicId") topicId?: string,
  ) {
    return this.questionsService.find({ status, type, examId, examVersionId, topicId });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.questionsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.questionsService.create(dto, user.userId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.questionsService.update(id, dto, user.userId);
  }

  @Post(":id/status")
  changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.questionsService.changeStatus(id, dto, user.userId);
  }

  @Get(":id/topics")
  findTopics(@Param("id") id: string) {
    return this.questionsService.findTopics(id);
  }

  @Post(":id/topics")
  mapTopic(
    @Param("id") id: string,
    @Body() dto: MapTopicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.questionsService.mapTopic(id, dto, user.userId);
  }

  @Delete(":id/topics/:topicId")
  unmapTopic(
    @Param("id") id: string,
    @Param("topicId") topicId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.questionsService.unmapTopic(id, topicId, user.userId);
  }
}
