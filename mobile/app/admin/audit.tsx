import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, ErrorText, H1, LoadingScreen, Muted, Screen, SecondaryButton } from "../../src/components/ui";
import { adminAuditLogs, AuditEntry } from "../../src/lib/admin-api";
import { useAuth } from "../../src/lib/auth-context";

export default function AdminAuditScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    adminAuditLogs(token)
      .then(setEntries)
      .catch(() => setError("Could not load the audit log."));
  }, [ready, token]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  return (
    <Screen>
      <SecondaryButton title="← Administration" onPress={() => router.push("/admin")} />
      <H1>Audit log</H1>
      <ErrorText>{error}</ErrorText>
      {entries === null && !error ? <LoadingScreen label="Loading…" /> : null}
      {entries?.map((e) => (
        <View key={e.id} style={styles.row}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{e.action}</Text>
          <Muted>
            {e.entityType} {e.entityId.slice(0, 8)} · {new Date(e.createdAt).toLocaleString()}
          </Muted>
          {e.description ? <Muted>{e.description}</Muted> : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 4 },
});
