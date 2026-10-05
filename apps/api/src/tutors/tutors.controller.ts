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
import { TutorsService } from "./tutors.service";
import { AddSpecializationDto, UpdateTutorProfileDto } from "./dto/tutors.dto";

const PHOTO_DIR = join(process.cwd(), "uploads", "tutor-photos");
const RESUME_DIR = join(process.cwd(), "uploads", "tutor-resumes");
const ALLOWED_PHOTO_MIMETYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

@ApiTags("tutors")
@ApiBearerAuth()
@Controller("tutors/me")
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Get()
  getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.getMyProfile(user);
  }

  @Patch()
  updateMyProfile(@Body() dto: UpdateTutorProfileDto, @CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.updateMyProfile(user, dto);
  }

  @Post("photo")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: diskStorage({
        destination: PHOTO_DIR,
        // Server-generated filename - never trust the client's original
        // filename (path traversal / overwrite risk).
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_PHOTO_MIMETYPES.has(file.mimetype)) {
          cb(new BadRequestException("Photo must be a PNG, JPEG, WebP or SVG image"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUserPayload) {
    if (!file) {
      throw new BadRequestException("No photo file was uploaded");
    }
    return this.tutorsService.setPhoto(user, `/uploads/tutor-photos/${file.filename}`);
  }

  @Post("resume")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("resume", {
      storage: diskStorage({
        destination: RESUME_DIR,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
          cb(new BadRequestException("Resume must be a PDF file"), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadResume(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUserPayload) {
    if (!file) {
      throw new BadRequestException("No resume file was uploaded");
    }
    return this.tutorsService.setResume(user, `/uploads/tutor-resumes/${file.filename}`);
  }

  @Get("specializations")
  listSpecializations(@CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.listMySpecializations(user);
  }

  @Post("specializations")
  addSpecialization(@Body() dto: AddSpecializationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.addSpecialization(user, dto);
  }

  @Delete("specializations/:id")
  removeSpecialization(@Param("id") id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.removeSpecialization(user, id);
  }

  @Post("submit")
  submit(@CurrentUser() user: CurrentUserPayload) {
    return this.tutorsService.submitForReview(user);
  }
}
