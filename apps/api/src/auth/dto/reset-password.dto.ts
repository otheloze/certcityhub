import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "6-digit code sent by email" })
  @Matches(/^\d{6}$/, { message: "code must be a 6-digit number" })
  code!: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  newPassword!: string;
}
