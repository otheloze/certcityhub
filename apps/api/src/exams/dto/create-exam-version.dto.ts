import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsString, ValidateNested } from "class-validator";
import { ExamVersionConfigDto } from "./exam-version-config.dto";

export class CreateExamVersionDto {
  @ApiProperty({ description: "e.g. '2026-v1'" })
  @IsString()
  versionLabel!: string;

  @ApiProperty({ type: ExamVersionConfigDto })
  @ValidateNested()
  @Type(() => ExamVersionConfigDto)
  config!: ExamVersionConfigDto;
}
