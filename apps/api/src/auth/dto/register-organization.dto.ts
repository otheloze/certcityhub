import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterOrganizationDto {
  @ApiProperty({ description: "The organization's name" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  organizationName!: string;

  @ApiProperty({ description: "Email for the organization's administrator account" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  password!: string;
}
