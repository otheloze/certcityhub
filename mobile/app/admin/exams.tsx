import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../src/components/ui";
import { ExamSummary, fetchExamCatalogue } from "../../src/lib/api-client";
import { AdminVersion, adminCreateExam, adminCreateVersion, adminListVersions, adminPublishVersion, slugify } from "../../src/lib/admin-api";
import { useAuth } from "../../src/lib/auth-context";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function AdminExamsScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [versions, setVersions] = useState<Record<string, AdminVersion[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [creatingExam, setCreatingExam] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await fetchExamCatalogue();
      setExams(list);
      const entries = await Promise.all(list.map(async (e) => [e.id, await adminListVersions(token, e.id)] as const));
      setVersions(Object.fromEntries(entries));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token, load]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;
  if (!loaded) return <LoadingScreen label="Loading exams…" />;

  async function createExam() {
    if (!token || !title) return;
    setError(null);
    setMessage(null);
    setCreatingExam(true);
    try {
      await adminCreateExam(token, { slug: slug || slugify(title), title, description: description || undefined });
      setMessage(`Exam "${title}" created. Add a version below.`);
      setTitle("");
      setSlug("");
      setDescription("");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCreatingExam(false);
    }
  }

  async function publish(version: AdminVersion) {
    if (!token) return;
    setError(null);
    setMessage(null);
    try {
      await adminPublishVersion(token, version.id);
      setMessage(`Version ${version.versionLabel} published. Its topic tree and configuration are now frozen.`);
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <Screen>
      <SecondaryButton title="← Administration" onPress={() => router.push("/admin")} />
      <H1>Exams & content</H1>
      <Muted>Everything below is data: adding an exam needs no code change.</Muted>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <H2>New exam</H2>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="URL name (optional)" value={slug} onChangeText={setSlug} placeholder={title ? slugify(title) : "auto"} autoCapitalize="none" />
        <Field label="Description (optional)" value={description} onChangeText={setDescription} />
        <PrimaryButton title={creatingExam ? "Creating…" : "Create exam"} onPress={createExam} disabled={creatingExam || !title} />
      </Card>

      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          versions={versions[exam.id] ?? []}
          onPublish={publish}
          onOpenVersion={(v) => router.push(`/admin/versions/${v.id}`)}
          token={token}
          onVersionAdded={load}
        />
      ))}
    </Screen>
  );
}

function ExamCard({
  exam,
  versions,
  onPublish,
  onOpenVersion,
  token,
  onVersionAdded,
}: {
  exam: ExamSummary;
  versions: AdminVersion[];
  onPublish: (v: AdminVersion) => void;
  onOpenVersion: (v: AdminVersion) => void;
  token: string;
  onVersionAdded: () => void;
}) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [allowBack, setAllowBack] = useState(true);
  const [allowChanges, setAllowChanges] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [count, setCount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit() {
    if (!label) return;
    setError(null);
    setCreating(true);
    try {
      await adminCreateVersion(token, exam.id, {
        versionLabel: label,
        config: {
          durationSeconds: (Number(minutes) || 60) * 60,
          navigation: { allowBackNavigation: allowBack, allowAnswerChanges: allowChanges, allowMarkForReview: allowReview },
          scoringStrategy: { type: "RAW" },
          blueprint: count ? { questionCount: Number(count), randomize: false } : undefined,
        },
      });
      setLabel("");
      onVersionAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create version.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <H2>{exam.title}</H2>
      {versions.map((v) => (
        <View key={v.id} style={styles.versionRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{v.versionLabel}</Text>
            <Muted>
              {v.status} · {Math.round(v.config.durationSeconds / 60)} min · {v.config.blueprint?.questionCount ?? "all"} questions
            </Muted>
          </View>
          <View style={{ gap: 6 }}>
            <SecondaryButton title="Topics & questions" onPress={() => onOpenVersion(v)} />
            {v.status === "DRAFT" ? <SecondaryButton title="Publish" onPress={() => onPublish(v)} /> : null}
          </View>
        </View>
      ))}

      <Muted>New version</Muted>
      <Field label="Label" value={label} onChangeText={setLabel} placeholder="2027-v1" />
      <Field label="Duration (minutes)" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
      <Field label="Questions per attempt (optional)" value={count} onChangeText={setCount} keyboardType="number-pad" placeholder="all" />
      <View style={styles.switchRow}>
        <Muted>Allow going back</Muted>
        <Switch value={allowBack} onValueChange={setAllowBack} />
      </View>
      <View style={styles.switchRow}>
        <Muted>Allow changing answers</Muted>
        <Switch value={allowChanges} onValueChange={setAllowChanges} />
      </View>
      <View style={styles.switchRow}>
        <Muted>Allow mark for review</Muted>
        <Switch value={allowReview} onValueChange={setAllowReview} />
      </View>
      <ErrorText>{error}</ErrorText>
      <SecondaryButton title={creating ? "Creating…" : "Create version"} onPress={submit} disabled={creating || !label} />
    </Card>
  );
}

const styles = StyleSheet.create({
  versionRow: { gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
