import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen } from "../src/components/ui";
import {
  CreditTransactionView,
  Product,
  Wallet,
  fetchProducts,
  fetchTransactions,
  fetchWallet,
  formatPrice,
} from "../src/lib/api-client";
import { useAuth } from "../src/lib/auth-context";
import { checkoutWithPaypal } from "../src/lib/paypal";

type Currency = "USD" | "NGN" | "KES";

// Same fixed display amounts as apps/web/src/components/pricing-cards.tsx -
// kept in sync by hand (same duplication pattern as this file's own mirror
// of the web api-client, documented in CLAUDE.md).
const ALT_PRICES: Record<string, { ngnCents: number; kesCents: number }> = {
  FREE: { ngnCents: 0, kesCents: 0 },
  SILVER: { ngnCents: 350000, kesCents: 30000 },
  GOLD: { ngnCents: 600000, kesCents: 70000 },
  PREMIUM: { ngnCents: 1800000, kesCents: 150000 },
};

function formatAltCurrency(cents: number, currency: "NGN" | "KES"): string {
  const symbol = currency === "NGN" ? "₦" : "Ksh ";
  if (cents === 0) return `${symbol}0.00`;
  return `${symbol}${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function displayPrice(currency: Currency, code: string, usdFallback: string): string {
  if (currency === "USD") return usdFallback;
  const key = currency === "NGN" ? "ngnCents" : "kesCents";
  const amount = ALT_PRICES[code]?.[key];
  if (amount === undefined) return usdFallback;
  return formatAltCurrency(amount, currency);
}

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
  const [currency, setCurrency] = useState<Currency>("USD");

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

  // useFocusEffect, not useEffect: the PayPal checkout flow briefly
  // navigates away to app/paypal-return.tsx and back here via
  // router.replace, which doesn't remount this screen - a plain useEffect
  // (mount-only) would never refetch and the just-completed purchase
  // wouldn't show up until some unrelated remount.
  useFocusEffect(
    useCallback(() => {
      if (!ready || !token) return;
      load();
    }, [ready, token, load]),
  );

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  async function buy(product: Product) {
    if (!token) return;
    setBuying(product.id);
    setError(null);
    setNotice(null);
    try {
      const result = await checkoutWithPaypal(token, product.id);
      if (result.status === "success") {
        setNotice(`Added ${product.credits} attempt${product.credits === 1 ? "" : "s"} (${product.name}) via PayPal.`);
        await load();
      } else if (result.status === "error") {
        setError(result.message);
      }
      // "cancelled": the buyer backed out of PayPal - no error, no notice.
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
        <View style={styles.currencyRow}>
          {(["USD", "NGN", "KES"] as Currency[]).map((c) => (
            <Pressable
              key={c}
              onPress={() => setCurrency(c)}
              style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
            >
              <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        {products.length === 0 ? (
          <Muted>No packs are available yet.</Muted>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>{product.name}</Text>
              <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 18 }}>
                {displayPrice(currency, product.code, formatPrice(product.priceCents, product.currency))}
              </Text>
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
  currencyRow: { flexDirection: "row", gap: 8 },
  currencyChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  currencyChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  currencyChipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  currencyChipTextActive: { color: "#fff" },
});
