import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { DashboardService } from "./dashboard.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("me")
  me(@CurrentUser() user: CurrentUserPayload) {
    return { id: user.userId, email: user.email, role: user.role };
  }

  @Get("me/dashboard")
  myDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboard.forUser(user.userId);
  }
}
