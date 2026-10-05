import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { OrganizationsService } from "./organizations.service";
import { ExamsService } from "../exams/exams.service";
import { ExamVersionsService } from "../exams/exam-versions.service";
import { TopicsService } from "../topics/topics.service";
import { QuestionsService } from "../questions/questions.service";
import { CreateExamDto } from "../exams/dto/create-exam.dto";
import { CreateExamVersionDto } from "../exams/dto/create-exam-version.dto";
import { UpdateExamVersionDto } from "../exams/dto/update-exam-version.dto";
import { CreateTopicDto } from "../topics/dto/create-topic.dto";
import { UpdateTopicDto } from "../topics/dto/update-topic.dto";
import { CreateQuestionDto } from "../questions/dto/create-question.dto";
import { UpdateQuestionDto } from "../questions/dto/update-question.dto";
import { ChangeStatusDto } from "../questions/dto/change-status.dto";
import { MapTopicDto } from "../questions/dto/map-topic.dto";

// Thin, org-scoped mirror of the platform admin CMS (ExamsController /
// ExamVersionsController / TopicsController / QuestionsController).
// Deliberately a SEPARATE controller rather than adding ORG_ADMIN to those
// controllers' @Roles() gates - avoids touching currently-stable, already-
// shipped platform CMS code. Every method resolves the caller's own org,
// asserts ownership of the target resource, then delegates to the exact
// same, unmodified services the platform admin CMS uses.
@ApiTags("organizations-exams")
@ApiBearerAuth()
@Controller("organizations/me/exams")
export class OrgExamsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly examsService: ExamsService,
    private readonly examVersionsService: ExamVersionsService,
    private readonly topicsService: TopicsService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserPayload) {
    const org = await this.organizationsService.requireCallerOrg(user);
    return this.examsService.findAllForOrganization(org.id);
  }

  @Post()
  async create(@Body() dto: CreateExamDto, @CurrentUser() user: CurrentUserPayload) {
    const org = await this.organizationsService.requireCallerOrg(user);
    return this.examsService.create(dto, user.userId, org.id);
  }

  @Get(":examId/versions")
  async listVersions(@Param("examId") examId: string, @CurrentUser() user: CurrentUserPayload) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExam(org.id, examId);
    return this.examVersionsService.findForExam(examId, true);
  }

  @Post(":examId/versions")
  async createVersion(
    @Param("examId") examId: string,
    @Body() dto: CreateExamVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExam(org.id, examId);
    return this.examVersionsService.create(examId, dto, user.userId);
  }

  @Patch("versions/:versionId")
  async updateVersion(
    @Param("versionId") versionId: string,
    @Body() dto: UpdateExamVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExamVersion(org.id, versionId);
    return this.examVersionsService.update(versionId, dto, user.userId);
  }

  @Post("versions/:versionId/publish")
  async publishVersion(@Param("versionId") versionId: string, @CurrentUser() user: CurrentUserPayload) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExamVersion(org.id, versionId);
    return this.examVersionsService.publish(versionId, user.userId);
  }

  @Get("versions/:versionId/topics")
  async topicTree(
    @Param("versionId") versionId: string,
    @Query("includeArchived") includeArchived: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExamVersion(org.id, versionId);
    return this.topicsService.findTree(versionId, includeArchived === "true");
  }

  @Post("topics")
  async createTopic(@Body() dto: CreateTopicDto, @CurrentUser() user: CurrentUserPayload) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExamVersion(org.id, dto.examVersionId);
    return this.topicsService.create(dto, user.userId);
  }

  @Patch("topics/:topicId")
  async updateTopic(
    @Param("topicId") topicId: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsTopic(org.id, topicId);
    return this.topicsService.update(topicId, dto, user.userId);
  }

  @Get("questions")
  async listQuestions(
    @Query("examId") examId: string,
    @Query("examVersionId") examVersionId: string | undefined,
    @Query("topicId") topicId: string | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExam(org.id, examId);
    return this.questionsService.find({ examId, examVersionId, topicId });
  }

  @Post("questions")
  async createQuestion(@Body() dto: CreateQuestionDto, @CurrentUser() user: CurrentUserPayload) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsExam(org.id, dto.examId);
    return this.questionsService.create(dto, user.userId);
  }

  @Patch("questions/:questionId")
  async updateQuestion(
    @Param("questionId") questionId: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsQuestion(org.id, questionId);
    return this.questionsService.update(questionId, dto, user.userId);
  }

  @Post("questions/:questionId/status")
  async changeQuestionStatus(
    @Param("questionId") questionId: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsQuestion(org.id, questionId);
    return this.questionsService.changeStatus(questionId, dto, user.userId);
  }

  @Post("questions/:questionId/topics")
  async mapTopic(
    @Param("questionId") questionId: string,
    @Body() dto: MapTopicDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const org = await this.organizationsService.requireCallerOrg(user);
    await this.organizationsService.assertOwnsQuestion(org.id, questionId);
    return this.questionsService.mapTopic(questionId, dto, user.userId);
  }
}
