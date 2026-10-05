import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, ValidateNested } from "class-validator";
import { ExamVersionConfigDto } from "./exam-version-config.dto";

export class UpdateExamVersionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  versionLabel?: string;

  @ApiProperty({ type: ExamVersionConfigDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExamVersionConfigDto)
  config?: ExamVersionConfigDto;
}
