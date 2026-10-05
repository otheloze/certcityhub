import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateTutorProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string;
}

export class AddSpecializationDto {
  @ApiProperty({ description: "Slug of the exam this specialization applies to, e.g. 'jamb-utme'" })
  @IsString()
  examSlug!: string;

  @ApiProperty({
    required: false,
    description: "A topic within that exam, e.g. 'Mathematics'. Omit to specialize in the whole exam.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  topicKeyword?: string;
}

export class RejectTutorDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
