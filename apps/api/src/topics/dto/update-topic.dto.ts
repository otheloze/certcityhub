import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Matches, Min, MaxLength } from "class-validator";

export class UpdateTopicDto {
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: "slug must be lowercase, alphanumeric, hyphen-separated",
  })
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
