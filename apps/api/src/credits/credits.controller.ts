import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { CreditsService } from "./credits.service";
import { CapturePaypalOrderDto, PurchaseDto, CreatePaypalOrderDto } from "./dto/credits.dto";

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
  @Post("credits/paypal/create-order")
  createPaypalOrder(@Body() dto: CreatePaypalOrderDto, @CurrentUser() user: CurrentUserPayload) {
    const redirect = dto.returnUrl && dto.cancelUrl ? { returnUrl: dto.returnUrl, cancelUrl: dto.cancelUrl } : undefined;
    return this.creditsService.createPaypalOrder(user.userId, dto.productId, redirect);
  }

  @ApiBearerAuth()
  @Post("credits/paypal/capture-order")
  capturePaypalOrder(@Body() dto: CapturePaypalOrderDto, @CurrentUser() user: CurrentUserPayload) {
    return this.creditsService.capturePaypalOrder(user.userId, dto.productId, dto.orderId);
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
