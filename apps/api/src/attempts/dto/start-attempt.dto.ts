import { ApiProperty } from "@nestjs/swagger";
import { AttemptMode } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class StartAttemptDto {
  @ApiProperty()
  @IsString()
  examVersionId!: string;

  @ApiProperty({
    enum: AttemptMode,
    required: false,
    description: "SIMULATION (default) consumes one attempt credit; PRACTICE is free.",
  })
  @IsOptional()
  @IsEnum(AttemptMode)
  mode?: AttemptMode;

  @ApiProperty({ required: false, description: "PRACTICE only: limit to a topic and its sub-topics" })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({ required: false, description: "PRACTICE only: number of questions (default 10)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  questionCount?: number;

  @ApiProperty({ required: false, description: "PRACTICE only: difficulty 1-5" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiProperty({
    required: false,
    description: "SIMULATION only: one-time organization exam access code, required when this credit is org-gated",
  })
  @IsOptional()
  @IsString()
  accessCode?: string;
}
