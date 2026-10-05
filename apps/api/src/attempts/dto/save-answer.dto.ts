import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";

export class SaveAnswerDto {
  @ApiProperty({
    description:
      "Shape depends on the question type: { optionLabel: string } for single_choice/true_false, " +
      "{ optionLabels: string[] } for multiple_choice, { value: number } for numeric, " +
      "{ text: string } for short_answer.",
  })
  @IsObject()
  responseData!: Record<string, unknown>;
}
