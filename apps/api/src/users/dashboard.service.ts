import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreditsService } from "../credits/credits.service";
import { TutorsService } from "../tutors/tutors.service";
import { buildDashboard, DashAttempt, DashScore } from "./dashboard.util";

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
    private readonly tutors: TutorsService,
  ) {}

  async forUser(userId: string) {
    const [rows, wallet] = await Promise.all([
      this.prisma.attempt.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 300,
        include: {
          score: true,
          examVersion: {
            select: { exam: { select: { id: true, slug: true, title: true, shortCode: true, category: true } } },
          },
        },
      }),
      this.credits.getWallet(userId),
    ]);

    const attempts: DashAttempt[] = rows.map((a) => ({
      id: a.id,
      mode: a.mode,
      status: a.status,
      startedAt: a.startedAt,
      examVersionId: a.examVersionId,
      exam: a.examVersion.exam,
      score: a.score
        ? {
            percentage: a.score.percentage,
            rawScore: a.score.rawScore,
            maxScore: a.score.maxScore,
            breakdown: (a.score.breakdown ?? {}) as DashScore["breakdown"],
          }
        : null,
    }));

    const dashboard = buildDashboard(attempts, wallet.total, new Date(), wallet.unlimited);
    // Layered on top of, not part of, buildDashboard's own pure logic -
    // matching reads its weakTopics output rather than being woven into it.
    const tutorSuggestions = await this.tutors.matchForWeakTopics(dashboard.weakTopics);
    return { ...dashboard, tutorSuggestions };
  }
}
