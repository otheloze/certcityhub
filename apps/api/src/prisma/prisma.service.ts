import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const CONNECT_MAX_ATTEMPTS = 5;
const CONNECT_RETRY_DELAY_MS = 2000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // The Supabase pooler this project talks to has shown intermittent,
  // transient connection failures during local dev. Retrying a few times on
  // startup avoids a hard crash of the whole process over a blip that
  // resolves itself within seconds - a crashed process needs a manual
  // restart, whereas a retry just costs a few seconds.
  async onModuleInit() {
    for (let attempt = 1; attempt <= CONNECT_MAX_ATTEMPTS; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt === CONNECT_MAX_ATTEMPTS) {
          throw error;
        }
        this.logger.warn(
          `Database connection attempt ${attempt}/${CONNECT_MAX_ATTEMPTS} failed, retrying in ${CONNECT_RETRY_DELAY_MS}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
