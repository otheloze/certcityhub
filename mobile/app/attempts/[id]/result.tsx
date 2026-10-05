import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AccuracyBars } from "../../../src/components/accuracy-bars";
import { ScoreRing } from "../../../src/components/score-ring";
import { Card, colors, ErrorText, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../../src/components/ui";
import {
  API_ORIGIN,
  Attempt,
  AttemptResult,
  ExamVersionSummary,
  fetchAttempt,
  fetchAttemptResult,
  fetchExamVersion,
  startAttempt,
} from "../../../src/lib/api-client";
import { useAuth } from "../../../src/lib/auth-context";

function verdict(pct: number) {
  if (pct >= 75) return { text: "✓ Strong result", tone: colors.good, advice: "You're performing well. Keep it sharp with a full simulation." };
  if (pct >= 50) return { text: "◐ Getting there", tone: colors.warn, advice: "Solid foundations. Target your weakest topics below." };
  return { text: "⚠ Needs work", tone: colors.danger, advice: "Focus on the topics below with practice sessions, then try again." };
}

export default function AttemptResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, ready } = useAuth();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [version, setVersion] = useState<ExamVersionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingTopic, setStartingTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const fetchedAttempt = await fetchAttempt(token!, id);
        if (fetchedAttempt.status === "IN_PROGRESS") {
          router.replace(`/attempts/${id}`);
          return;
        }
        const [fetchedResult, fetchedVersion] = await Promise.all([
          fetchAttemptResult(token!, id),
          fetchExamVersion(fetchedAttempt.examVersionId).catch(() => null),
        ]);
        if (cancelled) return;
        setAttempt(fetchedAttempt);
        setResult(fetchedResult);
        setVersion(fetchedVersion);
      } catch {
        if (!cancelled) setError("Could not load this result.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, ready]);

  async function practiceTopic(topicId: string) {
    if (!token || !attempt) return;
    setStartingTopic(topicId);
    try {
      const practice = await startAttempt(token, attempt.examVersionId, { mode: "PRACTICE", topicId, questionCount: 10 });
      router.push(`/attempts/${practice.id}`);
    } catch {
      setStartingTopic(null);
      setError("Could not start a practice session for that topic.");
    }
  }

  if (loading) return <LoadingScreen label="Loading your result…" />;
  if (!result || !attempt) {
    return (
      <Screen>
        <ErrorText>{error ?? "Result not available."}</ErrorText>
      </Screen>
    );
  }

  const questions = result.breakdown.questions;
  const correct = questions.filter((q) => q.isCorrect).length;
  const unanswered = questions.filter((q) => !q.answered).length;
  const incorrect = questions.length - correct - unanswered;
  const v = verdict(result.percentage);
  const isPractice = attempt.mode === "PRACTICE";
  const weakest = [...result.breakdown.topics].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <Screen>
      <H1>{version?.exam?.title ?? "Your result"}</H1>
      <Muted>{attempt.status === "EXPIRED" ? "Time ran out, so your answers were submitted automatically." : "Submitted."}</Muted>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <ScoreRing percentage={result.percentage} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: v.tone, fontWeight: "700", marginBottom: 4 }}>{v.text}</Text>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
            {result.rawScore % 1 === 0 ? result.rawScore : result.rawScore.toFixed(1)} /{" "}
            {result.maxScore % 1 === 0 ? result.maxScore : result.maxScore.toFixed(1)} points
          </Text>
          <Muted>{v.advice}</Muted>
        </View>
      </Card>

      <View style={styles.statsStrip}>
        <Stat value={correct} label="Correct" />
        <Stat value={incorrect} label="Incorrect" />
        <Stat value={unanswered} label="Unanswered" />
      </View>

      <View style={{ gap: 10 }}>
        <Link href={`/attempts/${id}/review`} asChild>
          <PrimaryButton title="Review your answers" onPress={() => {}} />
        </Link>
        {weakest && result.breakdown.topics.length > 1 ? (
          <SecondaryButton
            title={startingTopic === weakest.topicId ? "Starting…" : `Practise weakest: ${weakest.title}`}
            onPress={() => practiceTopic(weakest.topicId)}
            disabled={startingTopic !== null}
          />
        ) : null}
      </View>

      {result.breakdown.topics.length > 0 ? (
        <Card>
          <H2>Performance by topic</H2>
          <AccuracyBars
            rows={[...result.breakdown.topics]
              .sort((a, b) => a.accuracy - b.accuracy)
              .map((t) => ({
                id: t.topicId,
                label: t.title,
                value: t.accuracy,
                correct: t.correct,
                total: t.total,
                action: (
                  <Pressable onPress={() => practiceTopic(t.topicId)} disabled={startingTopic !== null} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>{startingTopic === t.topicId ? "…" : "Practise"}</Text>
                  </Pressable>
                ),
              }))}
          />
          <Muted>Sorted weakest first. Small samples can be misleading - treat them as a guide, not a verdict.</Muted>
        </Card>
      ) : null}

      {result.tutorSuggestions.length > 0 ? (
        <Card>
          <H2>Recommended tutors</H2>
          <Muted>Matched to this attempt's weakest topics. Contact them directly — booking isn't handled here.</Muted>
          {result.tutorSuggestions.map((t) => (
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
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Muted>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  statsStrip: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { color: colors.text, fontSize: 20, fontWeight: "800" },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  tutorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  tutorPhoto: { width: 44, height: 44, borderRadius: 22 },
  tutorInitial: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
