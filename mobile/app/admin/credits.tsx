import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen, SecondaryButton } from "../../src/components/ui";
import { ExamSummary, fetchExamCatalogue, formatPrice, Product } from "../../src/lib/api-client";
import {
  AdminAttempt,
  AdminUser,
  adminAdjust,
  adminGrant,
  adminListProducts,
  adminRefund,
  adminSearchUsers,
  adminUserAttempts,
} from "../../src/lib/admin-api";
import { useAuth } from "../../src/lib/auth-context";

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function AdminCreditsScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [attempts, setAttempts] = useState<AdminAttempt[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [grantCredits, setGrantCredits] = useState("1");
  const [grantScope, setGrantScope] = useState<"GLOBAL" | "EXAM">("GLOBAL");
  const [grantExamId, setGrantExamId] = useState("");
  const [grantDays, setGrantDays] = useState("");
  const [grantReason, setGrantReason] = useState("");

  const [adjustByLot, setAdjustByLot] = useState<Record<string, { amount: string; reason: string }>>({});
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    if (!ready || !token) return;
    fetchExamCatalogue().then(setExams).catch(() => undefined);
    adminListProducts(token)
      .then(setProducts)
      .catch(() => setError("Could not load attempt packs."));
  }, [ready, token]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  async function runSearch() {
    if (!token) return;
    setError(null);
    try {
      setUsers(await adminSearchUsers(token, search));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function selectUser(user: AdminUser) {
    if (!token) return;
    setSelected(user);
    setMessage(null);
    setError(null);
    try {
      setAttempts(await adminUserAttempts(token, user.id));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function refreshSelected() {
    if (!token || !selected) return;
    const fresh = (await adminSearchUsers(token, selected.email)).find((u) => u.id === selected.id);
    if (fresh) {
      setSelected(fresh);
      setUsers((prev) => prev.map((u) => (u.id === fresh.id ? fresh : u)));
    }
    setAttempts(await adminUserAttempts(token, selected.id));
  }

  async function act(fn: () => Promise<unknown>, success: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await fn();
      setMessage(success);
      await refreshSelected();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function submitGrant() {
    if (!token || !selected) return;
    act(
      () =>
        adminGrant(token, {
          userId: selected.id,
          credits: Number(grantCredits) || 1,
          scopeType: grantScope,
          examId: grantScope === "EXAM" ? grantExamId : undefined,
          validityDays: grantDays ? Number(grantDays) : undefined,
          reason: grantReason,
        }),
      `Granted ${grantCredits} attempt(s).`,
    ).then(() => setGrantReason(""));
  }

  const examName = (id: string | null) => exams.find((x) => x.id === id)?.title ?? "—";

  return (
    <Screen>
      <SecondaryButton title="← Administration" onPress={() => router.push("/admin")} />
      <H1>Credits & pricing</H1>
      {message ? <Muted>{message}</Muted> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <H2>Find a user</H2>
        <Field label="Email contains" value={search} onChangeText={setSearch} placeholder="student@" autoCapitalize="none" />
        <SecondaryButton title="Search" onPress={runSearch} />
        {users.map((u) => (
          <View key={u.id} style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{u.email}</Text>
              <Muted>
                {u.role} · {u.credits} attempts left
              </Muted>
            </View>
            <Pressable onPress={() => selectUser(u)} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Manage</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      {selected ? (
        <Card>
          <H2>
            {selected.email} — {selected.credits} attempts left
          </H2>

          <Muted>Credit lots</Muted>
          {selected.lots.length === 0 ? (
            <Muted>No active credits.</Muted>
          ) : (
            selected.lots.map((lot) => {
              const draft = adjustByLot[lot.id] ?? { amount: "", reason: "" };
              return (
                <View key={lot.id} style={styles.lotBlock}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    {lot.scopeType === "EXAM" ? examName(lot.examId) : "All exams"} · {lot.remaining} left
                  </Text>
                  <Field label="Change (±)" value={draft.amount} onChangeText={(v) => setAdjustByLot({ ...adjustByLot, [lot.id]: { ...draft, amount: v } })} keyboardType="numbers-and-punctuation" />
                  <Field label="Reason" value={draft.reason} onChangeText={(v) => setAdjustByLot({ ...adjustByLot, [lot.id]: { ...draft, reason: v } })} />
                  <SecondaryButton
                    title="Adjust"
                    onPress={() => act(() => adminAdjust(token, lot.id, Number(draft.amount), draft.reason), "Adjustment recorded.")}
                    disabled={busy || !draft.amount || draft.reason.trim().length < 3}
                  />
                </View>
              );
            })
          )}

          <Muted>Grant credits</Muted>
          <Field label="Attempts" value={grantCredits} onChangeText={setGrantCredits} keyboardType="number-pad" />
          <View style={styles.chipRow}>
            <Pressable onPress={() => setGrantScope("GLOBAL")} style={[styles.chip, grantScope === "GLOBAL" && styles.chipActive]}>
              <Text style={[styles.chipText, grantScope === "GLOBAL" && styles.chipTextActive]}>All exams</Text>
            </Pressable>
            <Pressable onPress={() => setGrantScope("EXAM")} style={[styles.chip, grantScope === "EXAM" && styles.chipActive]}>
              <Text style={[styles.chipText, grantScope === "EXAM" && styles.chipTextActive]}>One exam</Text>
            </Pressable>
          </View>
          {grantScope === "EXAM" ? (
            <View style={styles.chipRow}>
              {exams.map((x) => (
                <Pressable key={x.id} onPress={() => setGrantExamId(x.id)} style={[styles.chip, grantExamId === x.id && styles.chipActive]}>
                  <Text style={[styles.chipText, grantExamId === x.id && styles.chipTextActive]}>{x.title}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Field label="Expires after (days, optional)" value={grantDays} onChangeText={setGrantDays} keyboardType="number-pad" />
          <Field label="Reason (required)" value={grantReason} onChangeText={setGrantReason} />
          <PrimaryButton
            title="Grant"
            onPress={submitGrant}
            disabled={busy || grantReason.trim().length < 3 || (grantScope === "EXAM" && !grantExamId)}
          />

          <Muted>Attempts & refunds</Muted>
          <Field label="Refund reason" value={refundReason} onChangeText={setRefundReason} placeholder="e.g. connection dropped" />
          {attempts.map((a) => (
            <View key={a.id} style={styles.attemptRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {a.examTitle} ({a.versionLabel})
                </Text>
                <Muted>
                  {a.mode} · {a.status} · {a.refunded ? "Refunded" : a.creditConsumed ? "Used 1 credit" : "No credit used"}
                </Muted>
              </View>
              {a.creditConsumed && !a.refunded ? (
                <Pressable
                  onPress={() => act(() => adminRefund(token, a.id, refundReason), "Attempt refunded.")}
                  disabled={busy || refundReason.trim().length < 3}
                  style={[styles.smallBtn, refundReason.trim().length < 3 && { opacity: 0.5 }]}
                >
                  <Text style={styles.smallBtnText}>Refund</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <H2>Attempt packs</H2>
        <Muted>Pricing/catalog management is web-only for now — this is a read-only view.</Muted>
        {products.map((pr) => (
          <View key={pr.id} style={[styles.productRow, !pr.isActive && { opacity: 0.5 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {pr.name} ({pr.code})
              </Text>
              <Muted>
                {pr.scopeType === "EXAM" ? examName(pr.examId) : "All exams"} · {pr.unlimited ? "Unlimited" : pr.credits} attempts ·{" "}
                {formatPrice(pr.priceCents, pr.currency)} · {pr.validityDays ? `${pr.validityDays} days` : "never expires"}
              </Muted>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  smallBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  lotBlock: { gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  attemptRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  productRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
});
