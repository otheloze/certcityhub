import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { QuestionType } from "@examproject/shared-types";
import { QuestionOptionDto } from "./question-option.dto";

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  examId!: string;

  @ApiProperty()
  @IsString()
  examVersionId!: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: "Content block document, e.g. { blocks: [{ type: 'text', text: '...' }] }" })
  @IsObject()
  stem!: Record<string, unknown>;

  @ApiProperty({ description: "Shape varies by `type` - see packages/shared-types/answer-schemas.ts" })
  @IsObject()
  answerSchema!: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  explanation?: Record<string, unknown>;

  @ApiProperty({ type: [QuestionOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiProperty({ required: false, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTimeSeconds?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];
}
