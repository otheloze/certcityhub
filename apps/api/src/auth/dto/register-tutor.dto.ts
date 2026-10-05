import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterTutorDto {
  @ApiProperty({ description: "The tutor's name as it will appear on their public profile" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  password!: string;
}
