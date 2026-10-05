import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, Min, ValidateNested } from "class-validator";

export class NavigationConfigDto {
  @ApiProperty()
  @IsBoolean()
  allowBackNavigation!: boolean;

  @ApiProperty()
  @IsBoolean()
  allowAnswerChanges!: boolean;

  @ApiProperty()
  @IsBoolean()
  allowMarkForReview!: boolean;
}

export class ScoringStrategyConfigDto {
  @ApiProperty({ enum: ["RAW", "PERCENTAGE", "WEIGHTED"] })
  @IsIn(["RAW", "PERCENTAGE", "WEIGHTED"])
  type!: "RAW" | "PERCENTAGE" | "WEIGHTED";
}

// Deliberately simple for Sprint 2: pick `questionCount` PUBLISHED questions
// for this exam version, optionally shuffled. No per-topic quota or
// difficulty-distribution controls yet - see the architecture doc's future
// schema sketch for the fuller blueprint/question-pool design.
export class BlueprintConfigDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  questionCount!: number;

  @ApiProperty()
  @IsBoolean()
  randomize!: boolean;
}

export class ExamVersionConfigDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @ApiProperty({ type: NavigationConfigDto })
  @ValidateNested()
  @Type(() => NavigationConfigDto)
  navigation!: NavigationConfigDto;

  @ApiProperty({ type: ScoringStrategyConfigDto })
  @ValidateNested()
  @Type(() => ScoringStrategyConfigDto)
  scoringStrategy!: ScoringStrategyConfigDto;

  @ApiProperty({ type: BlueprintConfigDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BlueprintConfigDto)
  blueprint?: BlueprintConfigDto;
}
