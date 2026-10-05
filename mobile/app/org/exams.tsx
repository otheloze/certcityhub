import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth-context";
import { createOrgExam, fetchOrgExams, OrgExam } from "../../src/lib/org-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OrgExamsScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [exams, setExams] = useState<OrgExam[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchOrgExams(token)
      .then(setExams)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoaded(true));
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token, load]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;
  if (!loaded) return <LoadingScreen label="Loading exams…" />;

  async function handleCreate() {
    if (!token || !title) return;
    setError(null);
    setMessage(null);
    setCreating(true);
    try {
      await createOrgExam(token, { slug: slug || slugify(title), title, description: description || undefined });
      setMessage(`Exam "${title}" created. Add a version, topics and questions via the API to publish it.`);
      setTitle("");
      setSlug("");
      setDescription("");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Screen>
      <SecondaryButton title="← Organization" onPress={() => router.push("/org")} />
      <H1>Your custom exams</H1>
      <Muted>
        Exams created here are private to your organization: they never appear in the public catalogue, and only
        your members can attempt them, for free and without limit.
      </Muted>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <H2>New exam</H2>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="URL name (optional)" value={slug} onChangeText={setSlug} placeholder={title ? slugify(title) : "auto"} autoCapitalize="none" />
        <Field label="Description (optional)" value={description} onChangeText={setDescription} />
        <PrimaryButton title={creating ? "Creating…" : "Create exam"} onPress={handleCreate} disabled={creating || !title} />
      </Card>

      {exams.length === 0 ? (
        <Card>
          <Muted>No custom exams yet.</Muted>
        </Card>
      ) : (
        exams.map((exam) => (
          <View key={exam.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{exam.title}</Text>
              <Muted>{exam.slug}</Muted>
            </View>
            <Text style={styles.status}>{exam.status}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  status: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
