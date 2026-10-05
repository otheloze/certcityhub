import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen } from "../src/components/ui";
import {
  ApiError,
  CreditTransactionView,
  Product,
  Wallet,
  fetchProducts,
  fetchTransactions,
  fetchWallet,
  formatPrice,
  purchaseProduct,
} from "../src/lib/api-client";
import { useAuth } from "../src/lib/auth-context";

const REASON_LABEL: Record<CreditTransactionView["reason"], string> = {
  GRANT: "Attempts added",
  EXAM_STARTED: "Exam started",
  ADMIN_REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Adjustment",
};

function scopeLabel(lot: { scopeType: string; examTitle?: string | null }) {
  return lot.scopeType === "EXAM" ? (lot.examTitle ?? "One exam") : "All exams";
}

function sourceLabel(source: string) {
  return source === "FREE_PLAN" ? "Free plan" : source === "PURCHASE" ? "Purchased" : "Granted";
}

export default function WalletScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionView[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [w, t, p] = await Promise.all([fetchWallet(token), fetchTransactions(token), fetchProducts()]);
      setWallet(w);
      setTransactions(t);
      setProducts(p);
    } catch {
      setError("Could not load your wallet.");
    }
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    load();
  }, [ready, token, load]);

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  async function buy(product: Product) {
    if (!token) return;
    setBuying(product.id);
    setError(null);
    setNotice(null);
    try {
      await purchaseProduct(token, product.id);
      setNotice(`Added ${product.credits} attempt${product.credits === 1 ? "" : "s"} (${product.name}). Sandbox checkout - no real payment was taken.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 0 ? "Could not reach the server." : "The purchase could not be completed.");
    } finally {
      setBuying(null);
    }
  }

  return (
    <Screen>
      <H1>Your exam attempts</H1>
      <ErrorText>{error}</ErrorText>
      {notice ? <Muted>{notice}</Muted> : null}

      <Card>
        <Text style={styles.big}>{wallet ? (wallet.unlimited ? "∞" : wallet.total) : "…"}</Text>
        <Muted>{wallet?.unlimited ? "unlimited attempts" : "attempts remaining"}</Muted>
        <Muted>One attempt is used each time you start a full exam simulation. Practice is always free.</Muted>
      </Card>

      <Card>
        <H2>Your credits</H2>
        {wallet && wallet.lots.length > 0 ? (
          wallet.lots.map((lot) => (
            <View key={lot.id} style={styles.lotRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{scopeLabel(lot)}</Text>
                <Muted>
                  {sourceLabel(lot.source)} · {lot.questionFraction < 1 ? `${Math.round(lot.questionFraction * 100)}% of questions` : "Full exam"}
                </Muted>
              </View>
              <Text style={{ color: colors.text, fontWeight: "700" }}>
                {lot.unlimited ? "Unlimited" : `${lot.remaining}/${lot.granted}`}
              </Text>
            </View>
          ))
        ) : wallet ? (
          <Muted>You have no attempts right now. Choose a pack below, or practise for free.</Muted>
        ) : (
          <Muted>Loading…</Muted>
        )}
      </Card>

      <View style={{ gap: 10 }}>
        <H2>Attempt packs</H2>
        {products.length === 0 ? (
          <Muted>No packs are available yet.</Muted>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{product.name}</Text>
              <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>{formatPrice(product.priceCents, product.currency)}</Text>
              <Muted>
                {product.unlimited ? "Unlimited" : product.credits} attempt{product.unlimited || product.credits === 1 ? "" : "s"} ·{" "}
                {product.scopeType === "EXAM" ? "one exam" : "all exams"}
                {product.validityDays ? ` · valid ${product.validityDays} days` : " · never expire"}
              </Muted>
              {product.code === "FREE" ? (
                <Muted>Included automatically when you sign up</Muted>
              ) : (
                <PrimaryButton title={buying === product.id ? "Processing…" : "Buy now"} onPress={() => buy(product)} disabled={buying !== null} />
              )}
            </Card>
          ))
        )}
      </View>

      <Card>
        <H2>History</H2>
        {transactions.length === 0 ? (
          <Muted>No activity yet.</Muted>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text }}>{REASON_LABEL[tx.reason]}</Text>
                <Muted>{new Date(tx.createdAt).toLocaleString()}</Muted>
              </View>
              <Text style={{ color: tx.amount < 0 ? colors.danger : colors.good, fontWeight: "700" }}>
                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { color: colors.text, fontSize: 40, fontWeight: "800" },
  lotRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
});
