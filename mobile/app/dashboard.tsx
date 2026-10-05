import { Link, Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AccuracyBars } from "../src/components/accuracy-bars";
import { ScoreRing } from "../src/components/score-ring";
import { Card, colors, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen } from "../src/components/ui";
import { API_ORIGIN, Dashboard, fetchDashboard, startAttempt } from "../src/lib/api-client";
import { useAuth } from "../src/lib/auth-context";

export default function DashboardScreen() {
  const router = useRouter();
  const { token, user, ready, logout } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      fetchDashboard(token)
        .then((d) => !cancelled && setData(d))
        .catch(() => !cancelled && setError("Could not load your dashboard. Please refresh in a moment."))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [token]),
  );

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;
  if (loading) return <LoadingScreen label="Loading your dashboard…" />;
  if (!data) {
    return (
      <Screen>
        <Muted>{error ?? "Dashboard not available."}</Muted>
      </Screen>
    );
  }

  async function practise(examVersionId: string, topicId: string) {
    if (!token) return;
    setStarting(topicId);
    try {
      const attempt = await startAttempt(token, examVersionId, { mode: "PRACTICE", topicId, questionCount: 10 });
      router.push(`/attempts/${attempt.id}`);
    } catch {
      setStarting(null);
      setError("Could not start a practice session for that topic.");
    }
  }

  const rec = data.recommendation;
  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <Screen>
      <H1>Welcome back, {name}</H1>
      <View style={styles.navRow}>
        <Pressable onPress={() => router.push("/exams")} style={styles.navChip}>
          <Text style={styles.navChipText}>Exams</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/tutors")} style={styles.navChip}>
          <Text style={styles.navChipText}>Find a tutor</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/wallet")} style={styles.navChip}>
          <Text style={styles.navChipText}>Wallet</Text>
        </Pressable>
        {user?.role === "ADMIN" ? (
          <Pressable onPress={() => router.push("/admin")} style={styles.navChip}>
            <Text style={styles.navChipText}>Admin</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            logout();
            router.replace("/login");
          }}
          style={styles.navChip}
        >
          <Text style={styles.navChipText}>Log out</Text>
        </Pressable>
      </View>
      {error ? <Muted>{error}</Muted> : null}

      <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
        <Text style={styles.heroEyebrow}>Recommended next step</Text>
        <Text style={styles.heroTitle}>{rec.title}</Text>
        <Text style={styles.heroDetail}>{rec.detail}</Text>
        {rec.kind === "PRACTICE_TOPIC" && rec.examVersionId && rec.topicId ? (
          <PrimaryButton
            title={starting === rec.topicId ? "Starting…" : "Start practice"}
            onPress={() => practise(rec.examVersionId!, rec.topicId!)}
            disabled={starting !== null}
          />
        ) : (
          <Pressable onPress={() => router.push(rec.examSlug ? `/exams/${rec.examSlug}` : "/exams")} style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>{rec.kind === "START" ? "Browse exams" : "Open exam"}</Text>
          </Pressable>
        )}
      </Card>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {data.readiness ? (
          <ScoreRing percentage={data.readiness.percentage} label="readiness" />
        ) : (
          <Muted>No readiness estimate yet</Muted>
        )}
        <View style={{ flex: 1 }}>
          <H2>Readiness estimate</H2>
          <Muted>
            {data.readiness
              ? `Average of your last ${data.readiness.basedOn} simulation${data.readiness.basedOn === 1 ? "" : "s"}.`
              : "Complete a timed simulation and we will show an estimate based on your recent results."}
          </Muted>
        </View>
      </Card>

      <View style={styles.statsStrip}>
        <Stat value={data.creditsUnlimited ? "∞" : data.credits} label={data.creditsUnlimited ? "Unlimited attempts" : "Attempts left"} />
        <Stat value={data.stats.simulations} label="Simulations" />
        <Stat value={data.stats.questionsAnswered} label="Questions" />
        <Stat value={data.stats.streakDays} label="Day streak" />
      </View>

      <Card>
        <H2>Topics to work on</H2>
        {data.weakTopics.length === 0 ? (
          <Muted>Answer a few more questions and your weakest topics will appear here.</Muted>
        ) : (
          <AccuracyBars
            rows={data.weakTopics.map((t) => ({
              id: t.topicId + t.examVersionId,
              label: t.title,
              sub: t.examTitle,
              value: t.accuracy,
              correct: t.correct,
              total: t.total,
              action: (
                <Pressable onPress={() => practise(t.examVersionId, t.topicId)} disabled={starting !== null} style={styles.smallBtn}>
                  <Text style={styles.smallBtnText}>{starting === t.topicId ? "…" : "Practise"}</Text>
                </Pressable>
              ),
            }))}
          />
        )}
      </Card>

      <Card>
        <H2>Your strengths</H2>
        {data.strongTopics.length === 0 ? (
          <Muted>Strong topics show up once you have answered at least three questions in them.</Muted>
        ) : (
          <AccuracyBars
            rows={data.strongTopics.map((t) => ({
              id: t.topicId + t.examVersionId,
              label: t.title,
              sub: t.examTitle,
              value: t.accuracy,
              correct: t.correct,
              total: t.total,
            }))}
          />
        )}
      </Card>

      {data.tutorSuggestions.length > 0 ? (
        <Card>
          <H2>Recommended tutors</H2>
          <Muted>Matched to your weakest topics. Contact them directly — booking isn't handled here.</Muted>
          {data.tutorSuggestions.map((t) => (
            <Link key={t.tutorId} href={`/tutors/${t.tutorId}`} asChild>
              <Pressable style={styles.tutorRow}>
                {t.photoUrl ? (
                  <Image source={{ uri: `${API_ORIGIN}${t.photoUrl}` }} style={styles.tutorPhoto} />
                ) : (
                  <View style={styles.tutorInitial}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{t.displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{t.displayName}</Text>
                  {t.headline ? <Muted>{t.headline}</Muted> : null}
                  <Muted>
                    For {t.matchedTopic.title} ({t.matchedTopic.examTitle})
                  </Muted>
                </View>
              </Pressable>
            </Link>
          ))}
        </Card>
      ) : null}

      <Card>
        <H2>Your exams</H2>
        {data.exams.length === 0 ? (
          <Muted>You have not started any exams yet.</Muted>
        ) : (
          data.exams.map((e) => (
            <Pressable key={e.examId} onPress={() => router.push(`/exams/${e.slug}`)} style={styles.examRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{e.title}</Text>
                <Muted>
                  {e.simulations} sim · {e.practiceSessions} practice · avg {e.average === null ? "–" : `${e.average.toFixed(0)}%`}
                </Muted>
              </View>
            </Pressable>
          ))
        )}
      </Card>

      <Card>
        <H2>Recent activity</H2>
        {data.recent.length === 0 ? (
          <Muted>No attempts yet.</Muted>
        ) : (
          data.recent.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(a.status === "IN_PROGRESS" ? `/attempts/${a.id}` : `/attempts/${a.id}/result`)}
              style={styles.examRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{a.examTitle}</Text>
                <Muted>{a.mode === "SIMULATION" ? "Simulation" : "Practice"}</Muted>
              </View>
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {a.status === "IN_PROGRESS" ? "Resume" : a.percentage === null ? "–" : `${a.percentage.toFixed(0)}%`}
              </Text>
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Muted>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  navChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  navChipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  heroEyebrow: { color: "#fff", opacity: 0.85, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
  heroDetail: { color: "#fff", opacity: 0.9, marginTop: 4 },
  heroBtn: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  heroBtnText: { color: "#fff", fontWeight: "700" },
  statsStrip: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, minWidth: "40%", backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  tutorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  tutorPhoto: { width: 44, height: 44, borderRadius: 22 },
  tutorInitial: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  examRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
});
