import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, SecondaryButton, Screen } from "../../../src/components/ui";
import { TopicNode } from "../../../src/lib/api-client";
import {
  AdminQuestion,
  AdminVersion,
  adminChangeQuestionStatus,
  adminCreateTopic,
  adminGetVersion,
  adminListQuestions,
  adminPublishVersion,
  adminTopicTree,
  QuestionStatus,
  slugify,
} from "../../../src/lib/admin-api";
import { useAuth } from "../../../src/lib/auth-context";

const NEXT_STEPS: Record<QuestionStatus, { label: string; to: QuestionStatus }[]> = {
  DRAFT: [{ label: "Submit for review", to: "IN_REVIEW" }],
  IN_REVIEW: [
    { label: "Approve", to: "APPROVED" },
    { label: "Reject", to: "DRAFT" },
  ],
  APPROVED: [
    { label: "Publish", to: "PUBLISHED" },
    { label: "Back to draft", to: "DRAFT" },
  ],
  PUBLISHED: [{ label: "Retire", to: "RETIRED" }],
  RETIRED: [],
};

interface FlatTopic {
  id: string;
  title: string;
  depth: number;
}

function flatten(nodes: TopicNode[], depth = 0): FlatTopic[] {
  return nodes.flatMap((n) => [{ id: n.id, title: n.title, depth }, ...flatten(n.children, depth + 1)]);
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function AdminVersionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, ready } = useAuth();
  const [version, setVersion] = useState<AdminVersion | null>(null);
  const [tree, setTree] = useState<TopicNode[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [parentId, setParentId] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [v, t, q] = await Promise.all([adminGetVersion(token, id), adminTopicTree(token, id), adminListQuestions(token, id)]);
      setVersion(v);
      setTree(t);
      setQuestions(q);
    } catch (err) {
      setError(errorText(err));
    }
  }, [token, id]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token, load]);

  if (!ready || !version) return <LoadingScreen label={error ?? "Loading…"} />;

  const topics = flatten(tree);
  const editable = version.status === "DRAFT";

  async function addTopic() {
    if (!token || !topicTitle) return;
    setError(null);
    setMessage(null);
    try {
      await adminCreateTopic(token, { examVersionId: id, parentId: parentId || undefined, title: topicTitle, slug: slugify(topicTitle) });
      setTopicTitle("");
      setParentId("");
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function move(question: AdminQuestion, to: QuestionStatus) {
    if (!token) return;
    setError(null);
    setMessage(null);
    try {
      await adminChangeQuestionStatus(token, question.id, to);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function publishVersion() {
    if (!token) return;
    setError(null);
    try {
      await adminPublishVersion(token, id);
      setMessage("Version published. Its topic tree and configuration are now frozen.");
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <Screen>
      <SecondaryButton title="← Exams & content" onPress={() => router.push("/admin/exams")} />
      <H1>
        {version.exam?.title} — {version.versionLabel}
      </H1>
      <Text style={{ color: colors.muted, fontWeight: "700" }}>{version.status}</Text>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
      {editable ? (
        <Card>
          <Muted>This version is a draft. Build the topic tree and review questions, then publish it.</Muted>
          <SecondaryButton title="Publish version" onPress={publishVersion} />
        </Card>
      ) : (
        <Muted>Published versions are frozen: their configuration and topic tree can no longer change. Questions can still be published.</Muted>
      )}

      <Card>
        <H2>Topic tree</H2>
        {topics.length === 0 ? (
          <Muted>No topics yet.</Muted>
        ) : (
          topics.map((t) => (
            <Text key={t.id} style={[styles.topicRow, { paddingLeft: t.depth * 16 }]}>
              {t.title}
            </Text>
          ))
        )}
        {editable ? (
          <View style={{ gap: 8 }}>
            <Muted>Add topic under</Muted>
            <View style={styles.chipRow}>
              <Pressable onPress={() => setParentId("")} style={[styles.chip, parentId === "" && styles.chipActive]}>
                <Text style={[styles.chipText, parentId === "" && styles.chipTextActive]}>(top level)</Text>
              </Pressable>
              {topics.map((t) => (
                <Pressable key={t.id} onPress={() => setParentId(t.id)} style={[styles.chip, parentId === t.id && styles.chipActive]}>
                  <Text style={[styles.chipText, parentId === t.id && styles.chipTextActive]}>{t.title}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Title" value={topicTitle} onChangeText={setTopicTitle} />
            <SecondaryButton title="Add" onPress={addTopic} disabled={!topicTitle} />
          </View>
        ) : null}
      </Card>

      <Card>
        <H2>Questions ({questions.length})</H2>
        <Muted>
          Review and move status here. Writing new questions with structured content is web-only for now.
        </Muted>
        {questions.map((q) => (
          <View key={q.id} style={styles.questionRow}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{q.stem.blocks[0]?.text ?? q.title ?? "Untitled question"}</Text>
            <Muted>
              {q.type.replace("_", " ").toLowerCase()} ·{" "}
              {q.questionTopics.find((t) => t.isPrimary)?.topic.title ?? "no primary topic"} · {q.status.replace("_", " ")}
            </Muted>
            <View style={styles.chipRow}>
              {NEXT_STEPS[q.status].map((step) => (
                <Pressable key={step.to} onPress={() => move(q, step.to)} style={styles.smallBtn}>
                  <Text style={styles.smallBtnText}>{step.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topicRow: { color: colors.text, paddingVertical: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  questionRow: { gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
});
