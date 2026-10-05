import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@examproject/shared-types";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { CreditsService } from "./credits.service";
import {
  AdminAdjustDto,
  AdminGrantDto,
  AdminRefundDto,
  CreateProductDto,
  UpdateProductDto,
} from "./dto/credits.dto";

@ApiTags("admin-credits")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminCreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get("users")
  listUsers(@Query("search") search?: string) {
    return this.creditsService.adminListUsers(search);
  }

  @Get("users/:userId/attempts")
  userAttempts(@Param("userId") userId: string) {
    return this.creditsService.adminUserAttempts(userId);
  }

  @Post("credits/grant")
  grant(@Body() dto: AdminGrantDto, @CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.adminGrant(user.userId, dto);
  }

  @Post("credits/refund-attempt")
  refund(@Body() dto: AdminRefundDto, @CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.adminRefundAttempt(user.userId, dto.attemptId, dto.reason);
  }

  @Post("credits/adjust")
  adjust(@Body() dto: AdminAdjustDto, @CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.adminAdjust(user.userId, dto.lotId, dto.amount, dto.reason);
  }

  @Get("products")
  listProducts() {
    return this.creditsService.adminListProducts();
  }

  @Post("products")
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.adminCreateProduct(user.userId, dto);
  }

  @Patch("products/:id")
  updateProduct(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.creditsService.adminUpdateProduct(user.userId, id, dto);
  }
}
