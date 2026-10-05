import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from "class-validator";

export class QuestionOptionDto {
  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty({ description: "Content block document, e.g. { blocks: [{ type: 'text', text: '...' }] }" })
  @IsObject()
  content!: Record<string, unknown>;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
