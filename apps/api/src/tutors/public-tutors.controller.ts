import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { TutorsService } from "./tutors.service";

@ApiTags("tutors-public")
@Controller("tutors")
export class PublicTutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Public()
  @Get()
  list(@Query("examSlug") examSlug?: string) {
    return this.tutorsService.publicList({ examSlug });
  }

  @Public()
  @Get(":id")
  getById(@Param("id") id: string) {
    return this.tutorsService.publicGetById(id);
  }
}
