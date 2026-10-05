import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { QuestionStatus } from "@examproject/shared-types";

export class ChangeStatusDto {
  @ApiProperty({ enum: QuestionStatus })
  @IsEnum(QuestionStatus)
  targetStatus!: QuestionStatus;
}
