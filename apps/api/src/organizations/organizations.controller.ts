import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import { CurrentUser, CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { OrganizationsService } from "./organizations.service";
import { AddMemberDto, IssueAccessDto, UpdateOrganizationDto } from "./dto/organizations.dto";

const LOGO_DIR = join(process.cwd(), "uploads", "org-logos");
const ALLOWED_LOGO_MIMETYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations/me")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  getMyOrg(@CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.getMyOrg(user);
  }

  @Patch()
  updateMyOrg(@Body() dto: UpdateOrganizationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.updateMyOrg(user, dto);
  }

  @Post("logo")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: diskStorage({
        destination: LOGO_DIR,
        // Server-generated filename - never trust the client's original
        // filename (path traversal / overwrite risk).
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_LOGO_MIMETYPES.has(file.mimetype)) {
          cb(new BadRequestException("Logo must be a PNG, JPEG, WebP or SVG image"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUserPayload) {
    if (!file) {
      throw new BadRequestException("No logo file was uploaded");
    }
    return this.organizationsService.setLogo(user, `/uploads/org-logos/${file.filename}`);
  }

  @Get("members")
  listMembers(@CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.listMembers(user);
  }

  @Post("members")
  addMember(@Body() dto: AddMemberDto, @CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.addMember(user, dto);
  }

  @Delete("members/:id")
  revokeMember(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.revokeMember(user, id);
  }

  @Post("members/:id/access")
  async issueAccess(
    @Param("id") id: string,
    @Body() dto: IssueAccessDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const code = await this.organizationsService.issueAccess(user, id, dto.examSlug);
    // Returned once; the server never stores or re-serves the plaintext code.
    return { code };
  }

  @Post("access/:codeId/revoke")
  revokeAccess(@Param("codeId") codeId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.organizationsService.revokeAccess(user, codeId);
  }
}
