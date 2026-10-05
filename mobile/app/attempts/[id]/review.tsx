import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StemBlocks } from "../../../src/components/stem-blocks";
import { Card, colors, ErrorText, H1, LoadingScreen, Muted, Screen } from "../../../src/components/ui";
import { AttemptReview, ReviewQuestion, fetchAttemptReview } from "../../../src/lib/api-client";
import { useAuth } from "../../../src/lib/auth-context";

function blockText(blocks: { type: string; text?: string }[] | undefined) {
  return (blocks ?? []).map((b) => b.text ?? "").join(" ");
}

function describeAnswer(q: ReviewQuestion): string {
  const a = q.answer;
  if (!a) return "No answer";
  if (Array.isArray(a.optionLabels)) return (a.optionLabels as string[]).join(", ") || "No answer";
  if (typeof a.optionLabel === "string") return a.optionLabel;
  if (typeof a.value === "number") return String(a.value);
  if (typeof a.text === "string") return a.text;
  return "No answer";
}

function describeCorrect(q: ReviewQuestion): string {
  const c = q.feedback.correct;
  if (c.optionLabels) return c.optionLabels.join(", ");
  if (c.value !== undefined) return `${c.value}${c.tolerance ? ` (±${c.tolerance})` : ""}`;
  if (c.acceptedAnswers) return c.acceptedAnswers.join(", ");
  return "";
}

type Filter = "all" | "wrong" | "flagged";

export default function AttemptReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, ready } = useAuth();
  const [review, setReview] = useState<AttemptReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    fetchAttemptReview(token, id)
      .then((data) => !cancelled && setReview(data))
      .catch(() => !cancelled && setError("Could not load the review. Has the attempt been submitted?"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, token, ready, router]);

  if (loading) return <LoadingScreen label="Loading review…" />;
  if (!review) {
    return (
      <Screen>
        <ErrorText>{error ?? "Review not available."}</ErrorText>
      </Screen>
    );
  }

  const statusOf = (q: ReviewQuestion) => (q.feedback.isCorrect ? "correct" : q.answer != null ? "wrong" : "skipped");
  const wrongCount = review.questions.filter((q) => statusOf(q) !== "correct").length;
  const flaggedCount = review.questions.filter((q) => q.markedForReview).length;
  const shown = review.questions.filter((q) =>
    filter === "all" ? true : filter === "wrong" ? statusOf(q) !== "correct" : q.markedForReview,
  );

  return (
    <Screen>
      <H1>Review your answers</H1>
      <Muted>
        {review.score.rawScore.toFixed(1)} / {review.score.maxScore.toFixed(1)} points ({review.score.percentage.toFixed(1)}%)
      </Muted>

      <View style={styles.chipRow}>
        <Chip label={`All (${review.questions.length})`} active={filter === "all"} onPress={() => setFilter("all")} />
        <Chip label={`Incorrect/skipped (${wrongCount})`} active={filter === "wrong"} onPress={() => setFilter("wrong")} />
        <Chip label={`Flagged (${flaggedCount})`} active={filter === "flagged"} onPress={() => setFilter("flagged")} />
      </View>

      {shown.length === 0 ? (
        <Card>
          <Muted>Nothing to show for this filter.</Muted>
        </Card>
      ) : null}

      {shown.map((q) => {
        const status = statusOf(q);
        const tone = status === "correct" ? colors.good : status === "wrong" ? colors.danger : colors.muted;
        return (
          <Card key={q.id} style={{ borderColor: tone }}>
            <View style={styles.headingRow}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>Question {q.order + 1}</Text>
              <Text style={{ color: tone, fontWeight: "700" }}>
                {status === "correct" ? "✓ Correct" : status === "wrong" ? "✕ Incorrect" : "– Not answered"}
              </Text>
            </View>
            {q.markedForReview ? <Muted>⚑ Flagged</Muted> : null}
            <StemBlocks blocks={q.stem.blocks} />
            {q.options.length > 0 ? (
              <View style={{ gap: 4 }}>
                {q.options.map((o) => (
                  <Text key={o.label} style={{ color: colors.muted }}>
                    <Text style={{ fontWeight: "700", color: colors.text }}>{o.label}. </Text>
                    {blockText(o.content.blocks)}
                  </Text>
                ))}
              </View>
            ) : null}
            <Text style={{ color: colors.muted }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>Your answer: </Text>
              {describeAnswer(q)}
            </Text>
            {!q.feedback.isCorrect ? (
              <Text style={{ color: colors.muted }}>
                <Text style={{ fontWeight: "700", color: colors.text }}>Correct answer: </Text>
                {describeCorrect(q)}
              </Text>
            ) : null}
            {q.feedback.explanation ? <Muted>{blockText(q.feedback.explanation.blocks)}</Muted> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
