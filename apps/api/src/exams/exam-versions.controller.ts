import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ExamVersionStatus, Role } from "@examproject/shared-types";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ExamVersionsService } from "./exam-versions.service";
import { CreateExamVersionDto } from "./dto/create-exam-version.dto";
import { UpdateExamVersionDto } from "./dto/update-exam-version.dto";

@ApiTags("exam-versions")
@Controller()
export class ExamVersionsController {
  constructor(private readonly examVersionsService: ExamVersionsService) {}

  @Public()
  @Get("exams/:examId/versions")
  findPublished(@Param("examId") examId: string) {
    return this.examVersionsService.findForExam(examId, false);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get("exams/:examId/versions/all")
  findAll(@Param("examId") examId: string) {
    return this.examVersionsService.findForExam(examId, true);
  }

  @Public()
  @Get("exam-versions/:id")
  async findOne(@Param("id") id: string) {
    const version = await this.examVersionsService.findByIdWithExam(id);
    if (version.status !== ExamVersionStatus.PUBLISHED) {
      // Hide non-published versions from unauthenticated/public access.
      throw new NotFoundException("Exam version not found");
    }
    return version;
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get("admin/exam-versions/:id")
  findOneAsAdmin(@Param("id") id: string) {
    return this.examVersionsService.findByIdWithExam(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post("exams/:examId/versions")
  create(
    @Param("examId") examId: string,
    @Body() dto: CreateExamVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.examVersionsService.create(examId, dto, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch("exam-versions/:id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateExamVersionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.examVersionsService.update(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post("exam-versions/:id/publish")
  publish(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examVersionsService.publish(id, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post("exam-versions/:id/archive")
  archive(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examVersionsService.archive(id, user.userId);
  }
}
