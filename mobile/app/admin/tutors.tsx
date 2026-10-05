import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../src/components/ui";
import { API_ORIGIN } from "../../src/lib/api-client";
import { useAuth } from "../../src/lib/auth-context";
import { AdminTutorProfile, approveAdminTutor, fetchAdminTutors, rejectAdminTutor, TutorProfileStatus } from "../../src/lib/tutor-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

const FILTERS: { label: string; value: TutorProfileStatus | "" }[] = [
  { label: "Pending review", value: "PENDING_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Draft", value: "DRAFT" },
  { label: "All", value: "" },
];

export default function AdminTutorsScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [status, setStatus] = useState<TutorProfileStatus | "">("PENDING_REVIEW");
  const [tutors, setTutors] = useState<AdminTutorProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    if (!token) return;
    fetchAdminTutors(token, status || undefined)
      .then(setTutors)
      .catch((err) => setError(errorText(err)));
  }, [token, status]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token, load]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  async function handleApprove(id: string) {
    if (!token) return;
    setError(null);
    setMessage(null);
    setBusyId(id);
    try {
      await approveAdminTutor(token, id);
      setMessage("Tutor approved.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!token) return;
    const reason = reasons[id]?.trim();
    if (!reason) {
      setError("Give a reason so the tutor knows what to fix.");
      return;
    }
    setError(null);
    setMessage(null);
    setBusyId(id);
    try {
      await rejectAdminTutor(token, id, reason);
      setMessage("Sent back to the tutor with your feedback.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen>
      <SecondaryButton title="← Administration" onPress={() => router.push("/admin")} />
      <H1>Tutors</H1>
      <Muted>Review submitted profiles before they're listed publicly and suggested to students.</Muted>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.value} onPress={() => setStatus(f.value)} style={[styles.chip, status === f.value && styles.chipActive]}>
            <Text style={[styles.chipText, status === f.value && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {tutors.length === 0 ? (
        <Card>
          <Muted>No tutors match this filter.</Muted>
        </Card>
      ) : (
        tutors.map((tutor) => (
          <Card key={tutor.id}>
            <View style={styles.headRow}>
              {tutor.photoUrl ? (
                <Image source={{ uri: `${API_ORIGIN}${tutor.photoUrl}` }} style={styles.photo} />
              ) : (
                <View style={styles.initial}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{tutor.displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{tutor.displayName}</Text>
                <Muted>{tutor.user.email}</Muted>
              </View>
              <Text style={styles.statusPill}>{tutor.status}</Text>
            </View>
            {tutor.headline ? <Muted>{tutor.headline}</Muted> : null}
            {tutor.bio ? <Muted>{tutor.bio}</Muted> : null}
            <Text style={{ color: colors.muted }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>Specializations: </Text>
              {tutor.specializations.length === 0
                ? "none"
                : tutor.specializations.map((s) => (s.topicKeyword ? `${s.exam.title} — ${s.topicKeyword}` : s.exam.title)).join(", ")}
            </Text>
            {tutor.resumeUrl ? (
              <PrimaryButton title="View resume" onPress={() => Linking.openURL(`${API_ORIGIN}${tutor.resumeUrl}`)} />
            ) : (
              <Muted>No resume uploaded.</Muted>
            )}

            {tutor.status === "PENDING_REVIEW" ? (
              <View style={{ gap: 8 }}>
                <SecondaryButton title={busyId === tutor.id ? "…" : "Approve"} onPress={() => handleApprove(tutor.id)} disabled={busyId === tutor.id} />
                <Field
                  label="Reason for rejecting"
                  value={reasons[tutor.id] ?? ""}
                  onChangeText={(text) => setReasons((prev) => ({ ...prev, [tutor.id]: text }))}
                />
                <SecondaryButton title={busyId === tutor.id ? "…" : "Reject"} onPress={() => handleReject(tutor.id)} disabled={busyId === tutor.id} />
              </View>
            ) : null}
            {tutor.status === "REJECTED" && tutor.rejectionReason ? <Muted>Last feedback: {tutor.rejectionReason}</Muted> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  photo: { width: 48, height: 48, borderRadius: 24 },
  initial: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  statusPill: { color: colors.muted, fontSize: 11, fontWeight: "700" },
});
