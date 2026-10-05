import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { ExamsService } from "./exams.service";

@ApiTags("catalogue")
@Controller("catalogue")
export class CatalogueController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get()
  findAll() {
    return this.examsService.findCatalogueWithVersions();
  }
}
