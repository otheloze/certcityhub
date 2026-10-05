import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Deliberately minimal local-disk storage, not general object storage
  // (see the organizations feature plan for why) - one explicit, narrowly
  // scoped static route per upload type rather than serving the whole
  // uploads/ root, so a future unrelated upload type can't be served by
  // accident.
  const uploadDirs: Array<[string, string]> = [
    ["org-logos", "/uploads/org-logos"],
    ["tutor-photos", "/uploads/tutor-photos"],
    ["tutor-resumes", "/uploads/tutor-resumes"],
  ];
  for (const [dirName, prefix] of uploadDirs) {
    const dir = join(process.cwd(), "uploads", dirName);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    app.useStaticAssets(dir, { prefix });
  }

  app.setGlobalPrefix("api");
  // CORS_ORIGIN unset (local dev) => wide open, same as before. Set it to a
  // comma-separated list of allowed origins in production (e.g.
  // "https://yourdomain.com").
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Exam Platform API")
    .setDescription(
      "Sprint 1 (foundation): auth, exams, topics, questions, audit. " +
        "This Swagger UI is the Sprint-1 admin CMS interface.",
    )
    .setVersion("0.1")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
}

bootstrap();
