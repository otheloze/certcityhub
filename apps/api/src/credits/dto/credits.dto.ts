import { ApiProperty } from "@nestjs/swagger";
import { CreditScope } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class PurchaseDto {
  @ApiProperty()
  @IsString()
  productId!: string;
}

export class AdminGrantDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  credits!: number;

  @ApiProperty({ enum: CreditScope })
  @IsEnum(CreditScope)
  scopeType!: CreditScope;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiProperty({ required: false, description: "Omit for credits that never expire" })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiProperty({ required: false, description: "1 = full exam; 0.25 = a quarter of the questions" })
  @IsOptional()
  @IsNumber()
  @Min(0.05)
  @Max(1)
  questionFraction?: number;

  @ApiProperty({ description: "Mandatory - recorded in the ledger and audit log" })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class AdminRefundDto {
  @ApiProperty()
  @IsString()
  attemptId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class AdminAdjustDto {
  @ApiProperty()
  @IsString()
  lotId!: string;

  @ApiProperty({ description: "Signed change to the lot's remaining attempts, e.g. -1" })
  @IsInt()
  @Min(-10000)
  @Max(10000)
  amount!: number;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}

export class CreateProductDto {
  @ApiProperty({ example: "DEMO-10" })
  @IsString()
  @Matches(/^[A-Z0-9][A-Z0-9_-]*$/, { message: "code must be upper-case letters, digits, - or _" })
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: CreditScope })
  @IsEnum(CreditScope)
  scopeType!: CreditScope;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  credits!: number;

  @ApiProperty({ description: "Price in the smallest currency unit (cents)" })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ required: false, default: "USD" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, description: "Omit for credits that never expire" })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0.05)
  @Max(1)
  questionFraction?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  credits?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.05)
  @Max(1)
  questionFraction?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
