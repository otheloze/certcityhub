import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditLogInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  description?: string;
}

export interface AuditLogQuery {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  take?: number;
  skip?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before === undefined ? undefined : (input.before as any),
        after: input.after === undefined ? undefined : (input.after as any),
        description: input.description,
      },
    });
  }

  async find(query: AuditLogQuery) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: query.entityType,
        entityId: query.entityId,
        actorId: query.actorId,
      },
      orderBy: { createdAt: "desc" },
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    });
  }
}
