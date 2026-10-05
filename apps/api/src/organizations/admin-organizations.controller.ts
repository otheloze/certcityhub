import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@examproject/shared-types";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/organizations.dto";

// A platform admin setting up a new org tenant. Day-to-day org management
// (members, exam access, logo, custom exams) is self-service, under
// OrganizationsController / OrgExamsController.
@ApiTags("admin-organizations")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/organizations")
export class AdminOrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list() {
    return this.organizationsService.listOrganizations();
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.createOrganization(dto.name, user.userId);
  }
}
