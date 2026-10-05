import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, ErrorText, H1, H2, LoadingScreen, Muted, SecondaryButton, Screen } from "../../src/components/ui";
import { API_ORIGIN } from "../../src/lib/api-client";
import { useAuth } from "../../src/lib/auth-context";
import { fetchMyOrg, OrgProfile, updateMyOrg, uploadOrgLogo } from "../../src/lib/org-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function OrgHomeScreen() {
  const router = useRouter();
  const { token, ready, logout } = useAuth();
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [mission, setMission] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyOrg(token)
      .then((o) => {
        setOrg(o);
        setMission(o.missionStatement ?? "");
      })
      .catch((err) => setError(errorText(err)));
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token, load]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  async function saveMission() {
    if (!token) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await updateMyOrg(token, { missionStatement: mission });
      setOrg((o) => (o ? { ...o, ...updated } : updated));
      setMessage("Mission statement saved.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePickLogo() {
    if (!token) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const updated = await uploadOrgLogo(token, { uri: asset.uri, name: asset.fileName ?? "logo.png", type: asset.mimeType ?? "image/png" });
      setOrg(updated);
      setMessage("Logo updated.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploading(false);
    }
  }

  if (!org) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
        {!error ? <Muted>Loading your organization…</Muted> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.navRow}>
        <Pressable onPress={() => router.push("/org/members")} style={styles.navChip}>
          <Text style={styles.navChipText}>Members</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/org/exams")} style={styles.navChip}>
          <Text style={styles.navChipText}>Custom exams</Text>
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
      <H1>{org.name}</H1>
      <Muted>Organization dashboard</Muted>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <View style={styles.statsStrip}>
        <Pressable style={styles.stat} onPress={() => router.push("/org/members")}>
          <Text style={styles.statValue}>{org.memberCount}</Text>
          <Muted>Active members</Muted>
        </Pressable>
        <Pressable style={styles.stat} onPress={() => router.push("/org/exams")}>
          <Text style={styles.statValue}>{org.examCount}</Text>
          <Muted>Custom exams</Muted>
        </Pressable>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{org.allowedExamSlugs.length}</Text>
          <Muted>Grantable shared exams</Muted>
        </View>
      </View>

      <Card>
        <H2>Logo</H2>
        {org.logoUrl ? (
          <Image source={{ uri: `${API_ORIGIN}${org.logoUrl}` }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Muted>No logo uploaded yet.</Muted>
        )}
        <SecondaryButton title={uploading ? "Uploading…" : "Upload logo"} onPress={handlePickLogo} disabled={uploading} />
        <Muted>PNG, JPEG, WebP or SVG, up to 2MB.</Muted>
      </Card>

      <Card>
        <H2>Mission statement</H2>
        <Muted>Shown to your members and, where relevant, on your organization's pages.</Muted>
        <TextInput
          value={mission}
          onChangeText={setMission}
          multiline
          numberOfLines={4}
          maxLength={2000}
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
        <SecondaryButton title={saving ? "Saving…" : "Save mission statement"} onPress={saveMission} disabled={saving} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  navChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  navChipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  statsStrip: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, minWidth: "30%", backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  logo: { height: 80, width: 200, marginBottom: 4 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: "#0e1626",
    minHeight: 90,
    textAlignVertical: "top",
  },
});
