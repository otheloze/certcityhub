import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

export class CreateExamDto {
  @ApiProperty({ description: "URL-safe unique identifier, e.g. 'demo-cert'" })
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "slug must be lowercase, alphanumeric, hyphen-separated",
  })
  slug!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: "Catalogue grouping, e.g. 'Cloud', 'IT', 'School & University'" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiProperty({ required: false, description: "Short label shown on cards, e.g. 'CLF-C02'" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shortCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @ApiProperty({ required: false, description: "e.g. 'Foundational', 'Associate'" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  level?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
