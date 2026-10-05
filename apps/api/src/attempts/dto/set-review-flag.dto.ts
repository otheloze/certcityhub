import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class SetReviewFlagDto {
  @ApiProperty()
  @IsBoolean()
  marked!: boolean;
}
