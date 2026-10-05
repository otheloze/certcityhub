import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;
}

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  missionStatement?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedExamSlugs?: string[];
}

export class AddMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiProperty({ required: false, description: "The organization's own identifier for this candidate" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalRef?: string;
}

export class IssueAccessDto {
  @ApiProperty({ description: "Slug of the exam to grant one attempt on, e.g. 'jamb-utme'" })
  @IsString()
  examSlug!: string;
}
