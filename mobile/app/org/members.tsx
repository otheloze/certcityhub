import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth-context";
import {
  addOrgMember,
  fetchMyOrg,
  fetchOrgMembers,
  issueOrgAccess,
  OrgMember,
  revokeOrgAccess,
  revokeOrgMember,
} from "../../src/lib/org-api";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

function accessStatusLabel(status: string) {
  if (status === "UNUSED") return "Code issued, not yet used";
  if (status === "USED") return "Used";
  return "Revoked";
}

export default function OrgMembersScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [allowedExamSlugs, setAllowedExamSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [adding, setAdding] = useState(false);
  const [accessExamByMember, setAccessExamByMember] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [m, org] = await Promise.all([fetchOrgMembers(token), fetchMyOrg(token)]);
      setMembers(m);
      setAllowedExamSlugs(org.allowedExamSlugs);
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
  if (!loaded) return <LoadingScreen label="Loading members…" />;

  async function handleAddMember() {
    if (!token || !email) return;
    setError(null);
    setMessage(null);
    setAdding(true);
    try {
      const { temporaryPassword } = await addOrgMember(token, {
        email,
        displayName: displayName || undefined,
        externalRef: externalRef || undefined,
      });
      setMessage(`Member added. Temporary password (copy this now, it will not be shown again): ${temporaryPassword}`);
      setEmail("");
      setDisplayName("");
      setExternalRef("");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleIssueAccess(memberId: string) {
    if (!token) return;
    const examSlug = accessExamByMember[memberId] || allowedExamSlugs[0];
    if (!examSlug) return;
    setError(null);
    setMessage(null);
    setBusyId(memberId);
    try {
      const { code } = await issueOrgAccess(token, memberId, examSlug);
      setMessage(`One-time exam code for ${examSlug} (copy this now, it will not be shown again): ${code}`);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeAccess(codeId: string) {
    if (!token) return;
    setError(null);
    setMessage(null);
    setBusyId(codeId);
    try {
      await revokeOrgAccess(token, codeId);
      setMessage("Access code revoked.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeMember(memberId: string) {
    if (!token) return;
    setError(null);
    setMessage(null);
    setBusyId(memberId);
    try {
      await revokeOrgMember(token, memberId);
      setMessage("Member revoked.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen>
      <SecondaryButton title="← Organization" onPress={() => router.push("/org")} />
      <H1>Members</H1>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <H2>Add a member</H2>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Your own reference (optional)" value={externalRef} onChangeText={setExternalRef} placeholder="e.g. student ID" />
        <PrimaryButton title={adding ? "Adding…" : "Add member"} onPress={handleAddMember} disabled={adding || !email} />
      </Card>

      {members.length === 0 ? (
        <Card>
          <Muted>No members yet.</Muted>
        </Card>
      ) : (
        members.map((m) => (
          <Card key={m.id}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{m.email}</Text>
            <Muted>{m.displayName ?? "No display name"}</Muted>
            <View style={styles.statusRow}>
              <Text style={[styles.statusPill, { color: m.status === "ACTIVE" ? colors.good : colors.danger }]}>{m.status}</Text>
              {m.status === "ACTIVE" ? (
                <Pressable onPress={() => handleRevokeMember(m.id)} disabled={busyId === m.id} style={styles.smallBtn}>
                  <Text style={styles.smallBtnText}>{busyId === m.id ? "…" : "Revoke member"}</Text>
                </Pressable>
              ) : null}
            </View>

            {m.access.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Muted>Exam access:</Muted>
                {m.access.map((a) => (
                  <View key={a.id} style={styles.accessRow}>
                    <Muted>
                      {a.examId} — {accessStatusLabel(a.status)}
                    </Muted>
                    {a.status === "UNUSED" ? (
                      <Pressable onPress={() => handleRevokeAccess(a.id)} disabled={busyId === a.id} style={styles.smallBtn}>
                        <Text style={styles.smallBtnText}>{busyId === a.id ? "…" : "Revoke"}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {allowedExamSlugs.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Muted>Grant access</Muted>
                <View style={styles.chipRow}>
                  {allowedExamSlugs.map((slug) => (
                    <Pressable
                      key={slug}
                      onPress={() => setAccessExamByMember((prev) => ({ ...prev, [m.id]: slug }))}
                      style={[styles.chip, (accessExamByMember[m.id] ?? allowedExamSlugs[0]) === slug && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, (accessExamByMember[m.id] ?? allowedExamSlugs[0]) === slug && styles.chipTextActive]}
                      >
                        {slug}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <SecondaryButton title={busyId === m.id ? "…" : "Issue code"} onPress={() => handleIssueAccess(m.id)} disabled={busyId === m.id} />
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusPill: { fontSize: 12, fontWeight: "700" },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  accessRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
