import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen } from "../../src/components/ui";
import {
  ApiError,
  ExamSummary,
  ExamVersionSummary,
  TopicNode,
  fetchExamBySlug,
  fetchPublishedVersions,
  fetchTopicTree,
  startAttempt,
} from "../../src/lib/api-client";
import { useAuth } from "../../src/lib/auth-context";

interface TopicOption {
  id: string;
  title: string;
  depth: number;
}

function flattenTopics(nodes: TopicNode[], depth = 0): TopicOption[] {
  return nodes.flatMap((node) => [{ id: node.id, title: node.title, depth }, ...flattenTopics(node.children, depth + 1)]);
}

const SCORING_LABEL: Record<string, string> = {
  RAW: "Raw score (1 point per question)",
  PERCENTAGE: "Percentage correct",
  WEIGHTED: "Weighted by question difficulty",
};

export default function ExamDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [exam, setExam] = useState<ExamSummary | null>(null);
  const [version, setVersion] = useState<ExamVersionSummary | null>(null);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [topicId, setTopicId] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [busy, setBusy] = useState<"simulation" | "practice" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAccessCode, setNeedsAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const fetchedExam = await fetchExamBySlug(slug);
        if (cancelled) return;
        setExam(fetchedExam);
        const versions = await fetchPublishedVersions(fetchedExam.id).catch(() => []);
        const current = versions[0] ?? null;
        if (cancelled) return;
        setVersion(current);
        if (current) {
          const tree = await fetchTopicTree(current.id).catch(() => []);
          if (!cancelled) setTopics(flattenTopics(tree));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <LoadingScreen label="Loading exam…" />;
  if (!exam) {
    return (
      <Screen>
        <Muted>Exam not found.</Muted>
      </Screen>
    );
  }

  async function begin(kind: "simulation" | "practice") {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!version) return;
    setError(null);
    setBusy(kind);
    try {
      const attempt = await startAttempt(
        token,
        version.id,
        kind === "practice"
          ? { mode: "PRACTICE", topicId: topicId || undefined, questionCount: Number(questionCount) || 10 }
          : { mode: "SIMULATION", accessCode: accessCode || undefined },
      );
      router.push(`/attempts/${attempt.id}`);
    } catch (err) {
      setBusy(null);
      if (err instanceof ApiError && err.status === 402 && err.code === "ORG_ACCESS_CODE_REQUIRED") {
        setNeedsAccessCode(true);
        setError(needsAccessCode ? "That code was not accepted. Check it and try again." : null);
      } else if (err instanceof ApiError && err.status === 402) {
        setError("You have no attempts left for this exam. Practice is always free.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("No questions match those practice settings. Try a different topic.");
      } else {
        setError("Could not start. Please try again.");
      }
    }
  }

  return (
    <Screen>
      <H1>{exam.title}</H1>
      <Muted>
        {exam.provider ? `${exam.provider} · ` : ""}
        {exam.category}
        {exam.shortCode ? ` · ${exam.shortCode}` : ""}
      </Muted>
      {exam.description ? <Muted>{exam.description}</Muted> : null}

      {!version ? (
        <Card>
          <Muted>This exam isn't published yet. Check back soon.</Muted>
        </Card>
      ) : (
        <>
          <Card>
            <H2>Exam simulation</H2>
            <Muted>A timed, full-length exam with no hints until you finish. Uses one attempt.</Muted>
            <Muted>
              {Math.round(version.config.durationSeconds / 60)} min ·{" "}
              {SCORING_LABEL[version.config.scoringStrategy.type] ?? version.config.scoringStrategy.type}
            </Muted>
            {needsAccessCode ? (
              <Field
                label="One-time organization exam code"
                value={accessCode}
                onChangeText={setAccessCode}
                autoCapitalize="characters"
                placeholder="e.g. K7X9-MQ3P"
              />
            ) : null}
            <PrimaryButton
              title={busy === "simulation" ? "Starting…" : needsAccessCode ? "Submit code and start" : token ? "Start exam simulation" : "Log in to start"}
              onPress={() => begin("simulation")}
              disabled={busy !== null}
            />
          </Card>

          <Card>
            <H2>Practice</H2>
            <Muted>Choose what to work on and get instant feedback after each answer. Free and unlimited.</Muted>
            <Muted>Topic</Muted>
            <View style={styles.chipRow}>
              <Pressable onPress={() => setTopicId("")} style={[styles.chip, topicId === "" && styles.chipActive]}>
                <Text style={[styles.chipText, topicId === "" && styles.chipTextActive]}>All topics</Text>
              </Pressable>
              {topics.map((t) => (
                <Pressable key={t.id} onPress={() => setTopicId(t.id)} style={[styles.chip, topicId === t.id && styles.chipActive]}>
                  <Text style={[styles.chipText, topicId === t.id && styles.chipTextActive]}>{t.title}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Questions (1-50)" value={questionCount} onChangeText={setQuestionCount} keyboardType="number-pad" />
            <PrimaryButton title={busy === "practice" ? "Starting…" : "Start practice"} onPress={() => begin("practice")} disabled={busy !== null} />
          </Card>
        </>
      )}

      <ErrorText>{error}</ErrorText>
      <Muted>Independent practice content with original questions. Not affiliated with or endorsed by the exam provider.</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
