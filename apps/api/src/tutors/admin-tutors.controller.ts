import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TutorProfileStatus } from "@prisma/client";
import { Role } from "@examproject/shared-types";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { TutorsService } from "./tutors.service";
import { RejectTutorDto } from "./dto/tutors.dto";

@ApiTags("admin-tutors")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/tutors")
export class AdminTutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  list(@Query("status") status?: TutorProfileStatus) {
    return this.tutorsService.adminList(status);
  }

  @Post(":id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.adminApprove(user.userId, id);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Body() dto: RejectTutorDto, @CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.adminReject(user.userId, id, dto.reason);
  }
}
