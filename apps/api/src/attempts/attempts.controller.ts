import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { AttemptsService } from "./attempts.service";
import { StartAttemptDto } from "./dto/start-attempt.dto";
import { SaveAnswerDto } from "./dto/save-answer.dto";
import { SetReviewFlagDto } from "./dto/set-review-flag.dto";

@ApiTags("attempts")
@ApiBearerAuth()
@Controller("attempts")
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  start(@Body() dto: StartAttemptDto, @CurrentUser() user: CurrentUserPayload) {
    return this.attemptsService.start(dto, user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attemptsService.findById(id, user);
  }

  @Get(":id/questions")
  findQuestions(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attemptsService.findQuestions(id, user);
  }

  @Put(":id/answers/:questionId")
  saveAnswer(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() dto: SaveAnswerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attemptsService.saveAnswer(id, questionId, dto, user);
  }

  @Post(":id/submit")
  submit(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attemptsService.submit(id, user);
  }

  @Put(":id/review/:questionId")
  setReviewFlag(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() dto: SetReviewFlagDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attemptsService.setReviewFlag(id, questionId, dto, user);
  }

  @Post(":id/questions/:questionId/check")
  checkAnswer(
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attemptsService.checkAnswer(id, questionId, user);
  }

  @Get(":id/review")
  getReview(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attemptsService.getReview(id, user);
  }

  @Get(":id/result")
  getResult(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attemptsService.getResult(id, user);
  }
}
