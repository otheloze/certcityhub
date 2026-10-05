import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@examproject/shared-types";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { ExamsService } from "./exams.service";
import { CreateExamDto } from "./dto/create-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";

@ApiTags("exams")
@Controller("exams")
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get()
  findCatalogue() {
    return this.examsService.findCatalogue();
  }

  @Public()
  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.examsService.findBySlug(slug, false);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateExamDto, @CurrentUser() user: CurrentUserPayload) {
    return this.examsService.create(dto, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateExamDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.examsService.update(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post(":id/archive")
  archive(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examsService.archive(id, user.userId);
  }
}
