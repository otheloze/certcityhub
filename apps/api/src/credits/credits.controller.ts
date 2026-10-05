import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { CreditsService } from "./credits.service";
import { PurchaseDto } from "./dto/credits.dto";

@ApiTags("credits")
@Controller()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Public()
  @Get("products")
  listProducts(@Query("examId") examId?: string) {
    return this.creditsService.listActiveProducts(examId);
  }

  @ApiBearerAuth()
  @Post("credits/purchase")
  purchase(@Body() dto: PurchaseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.purchase(user.userId, dto.productId);
  }

  @ApiBearerAuth()
  @Get("users/me/credits")
  wallet(@CurrentUser() user: CurrentUserPayload, @Query("examId") examId?: string) {
    return this.creditsService.getWallet(user.userId, examId);
  }

  @ApiBearerAuth()
  @Get("users/me/transactions")
  transactions(@CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.listTransactions(user.userId);
  }
}
