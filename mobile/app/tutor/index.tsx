import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../src/components/ui";
import { API_ORIGIN, CatalogueExam, fetchCatalogue } from "../../src/lib/api-client";
import { useAuth } from "../../src/lib/auth-context";
import {
  addMySpecialization,
  fetchMyTutorProfile,
  PickedFile,
  removeMySpecialization,
  submitTutorProfile,
  TutorProfile,
  updateMyTutorProfile,
  uploadTutorPhoto,
  uploadTutorResume,
} from "../../src/lib/tutor-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

const STATUS_LABEL: Record<TutorProfile["status"], { text: string; tone: string }> = {
  DRAFT: { text: "Draft — not yet submitted", tone: colors.muted },
  PENDING_REVIEW: { text: "Submitted — awaiting review", tone: colors.warn },
  APPROVED: { text: "Approved — visible to students", tone: colors.good },
  REJECTED: { text: "Changes requested", tone: colors.danger },
};

export default function TutorProfileScreen() {
  const router = useRouter();
  const { token, ready, logout } = useAuth();
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [exams, setExams] = useState<CatalogueExam[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [examSlug, setExamSlug] = useState("");
  const [topicKeyword, setTopicKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [addingSpec, setAddingSpec] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyTutorProfile(token)
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName);
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
      })
      .catch((err) => setError(errorText(err)));
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
    fetchCatalogue()
      .then((list) => {
        setExams(list);
        if (list.length > 0) setExamSlug(list[0].slug);
      })
      .catch(() => undefined);
  }, [ready, token, load]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  async function saveProfile() {
    if (!token) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await updateMyTutorProfile(token, { displayName, headline, bio });
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Profile saved.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    if (!token) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const file: PickedFile = {
      uri: asset.uri,
      name: asset.fileName ?? "photo.jpg",
      type: asset.mimeType ?? "image/jpeg",
    };
    setError(null);
    setMessage(null);
    setUploadingPhoto(true);
    try {
      const updated = await uploadTutorPhoto(token, file);
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Photo updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handlePickResume() {
    if (!token) return;
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const file: PickedFile = { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/pdf" };
    setError(null);
    setMessage(null);
    setUploadingResume(true);
    try {
      const updated = await uploadTutorResume(token, file);
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Resume updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleAddSpecialization() {
    if (!token || !examSlug) return;
    setError(null);
    setMessage(null);
    setAddingSpec(true);
    try {
      const spec = await addMySpecialization(token, { examSlug, topicKeyword: topicKeyword || undefined });
      setProfile((p) => (p ? { ...p, specializations: [...p.specializations, spec] } : p));
      setTopicKeyword("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setAddingSpec(false);
    }
  }

  async function handleRemoveSpecialization(id: string) {
    if (!token) return;
    setError(null);
    setMessage(null);
    try {
      await removeMySpecialization(token, id);
      setProfile((p) => (p ? { ...p, specializations: p.specializations.filter((s) => s.id !== id) } : p));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function handleSubmit() {
    if (!token) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const updated = await submitTutorProfile(token);
      setProfile((p) => (p ? { ...p, ...updated } : updated));
      setMessage("Submitted for review. We'll email you once it's been checked.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
        {!error ? <Muted>Loading your profile…</Muted> : null}
      </Screen>
    );
  }

  const status = STATUS_LABEL[profile.status];
  const missing: string[] = [];
  if (!profile.photoUrl) missing.push("a profile photo");
  if (!profile.resumeUrl) missing.push("a resume");
  if (profile.specializations.length === 0) missing.push("at least one specialization");
  const canSubmit = missing.length === 0 && (profile.status === "DRAFT" || profile.status === "REJECTED");

  return (
    <Screen>
      <View style={styles.navRow}>
        <Pressable onPress={() => router.push("/tutors")} style={styles.navChip}>
          <Text style={styles.navChipText}>Public directory</Text>
        </Pressable>
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
      <H1>{profile.displayName || "Your tutor profile"}</H1>
      <Text style={{ color: status.tone, fontWeight: "700" }}>{status.text}</Text>
      {profile.status === "REJECTED" && profile.rejectionReason ? <ErrorText>Reviewer feedback: {profile.rejectionReason}</ErrorText> : null}
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <H2>Photo</H2>
        {profile.photoUrl ? (
          <Image source={{ uri: `${API_ORIGIN}${profile.photoUrl}` }} style={styles.photo} />
        ) : (
          <Muted>No photo uploaded yet.</Muted>
        )}
        <SecondaryButton title={uploadingPhoto ? "Uploading…" : "Upload photo"} onPress={handlePickPhoto} disabled={uploadingPhoto} />
        <Muted>PNG, JPEG, WebP or SVG, up to 2MB.</Muted>
      </Card>

      <Card>
        <H2>Resume</H2>
        {profile.resumeUrl ? (
          <PrimaryButton title="View current resume" onPress={() => Linking.openURL(`${API_ORIGIN}${profile.resumeUrl}`)} />
        ) : (
          <Muted>No resume uploaded yet.</Muted>
        )}
        <SecondaryButton title={uploadingResume ? "Uploading…" : "Upload resume"} onPress={handlePickResume} disabled={uploadingResume} />
        <Muted>PDF only, up to 5MB.</Muted>
      </Card>

      <Card>
        <H2>Profile details</H2>
        <Field label="Name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Headline" value={headline} onChangeText={setHeadline} placeholder="e.g. JAMB Mathematics tutor, 8 years' experience" />
        <View style={{ gap: 6 }}>
          <Muted>Bio</Muted>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={5}
            placeholderTextColor={colors.muted}
            style={[styles.textArea]}
          />
        </View>
        <SecondaryButton title={saving ? "Saving…" : "Save profile"} onPress={saveProfile} disabled={saving} />
      </Card>

      <Card>
        <H2>Areas of specialization</H2>
        <Muted>Add the exams and, optionally, specific topics you tutor. Students whose weak topics match get suggested your profile.</Muted>
        {profile.specializations.length > 0 ? (
          profile.specializations.map((s) => (
            <View key={s.id} style={styles.specRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{s.exam.title}</Text>
                <Muted>{s.topicKeyword ?? "Any topic"}</Muted>
              </View>
              <Pressable onPress={() => handleRemoveSpecialization(s.id)} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Remove</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Muted>No specializations added yet.</Muted>
        )}

        <Muted>Exam</Muted>
        <View style={styles.chipRow}>
          {exams.map((exam) => (
            <Pressable key={exam.slug} onPress={() => setExamSlug(exam.slug)} style={[styles.chip, examSlug === exam.slug && styles.chipActive]}>
              <Text style={[styles.chipText, examSlug === exam.slug && styles.chipTextActive]}>{exam.title}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Topic (optional)" value={topicKeyword} onChangeText={setTopicKeyword} placeholder="e.g. Mathematics" />
        <SecondaryButton title={addingSpec ? "Adding…" : "Add specialization"} onPress={handleAddSpecialization} disabled={addingSpec || !examSlug} />
      </Card>

      <Card>
        <H2>Submit for review</H2>
        {missing.length > 0 ? <Muted>Before you can submit, add: {missing.join(", ")}.</Muted> : null}
        <PrimaryButton title={submitting ? "Submitting…" : "Submit for review"} onPress={handleSubmit} disabled={!canSubmit || submitting} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: "row", gap: 8 },
  navChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  navChipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  photo: { width: 96, height: 96, borderRadius: 48 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: "#0e1626",
    minHeight: 100,
    textAlignVertical: "top",
  },
  specRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
