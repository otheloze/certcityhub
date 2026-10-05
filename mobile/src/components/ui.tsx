import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const colors = {
  bg: "#0b1220",
  card: "#131c2e",
  border: "#25324a",
  text: "#e7ecf7",
  muted: "#93a1bb",
  primary: "#3b82f6",
  danger: "#ef4444",
  good: "#22c55e",
  warn: "#f59e0b",
};

export function Screen({ children }: { children: ReactNode }) {
  // Android's edge-to-edge rendering draws content under the system gesture
  // bar by default - without this, the last bit of scrollable content (and
  // any fixed bottom bar elsewhere) ends up hidden behind it.
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, { paddingBottom: Math.max(48, insets.bottom + 24) }]}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Emboss effect: a light "highlight" layer offset up-left sits behind the
// main text, which itself carries a dark shadow offset down-right - the
// classic two-shadow engrave trick, done as two stacked Text nodes since RN
// only supports one native text-shadow per element.
export function EmbossedTitle({ children, size = 44 }: { children: string; size?: number }) {
  return (
    <View style={{ alignSelf: "center" }}>
      <Text
        style={[
          styles.embossBase,
          { fontSize: size, color: "rgba(255,255,255,0.18)", position: "absolute", top: -1, left: -1 },
        ]}
      >
        {children}
      </Text>
      <Text
        style={[
          styles.embossBase,
          {
            fontSize: size,
            color: colors.text,
            textShadowColor: "rgba(0,0,0,0.65)",
            textShadowOffset: { width: 1, height: 2 },
            textShadowRadius: 3,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children }: { children: ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.primaryBtn, (disabled || loading) && styles.btnDisabled, pressed && styles.btnPressed]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.secondaryBtn, disabled && styles.btnDisabled, pressed && styles.btnPressed]}
    >
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "good" | "warn" | "danger" }) {
  const toneColor = tone === "good" ? colors.good : tone === "warn" ? colors.warn : tone === "danger" ? colors.danger : colors.primary;
  return (
    <View style={[styles.badge, { borderColor: toneColor }]}>
      <Text style={[styles.badgeText, { color: toneColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: 20, paddingBottom: 48, gap: 16 },
  embossBase: { fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  h1: { fontSize: 24, fontWeight: "700", color: colors.text },
  h2: { fontSize: 18, fontWeight: "600", color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    backgroundColor: "#0e1626",
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.8 },
  error: { color: colors.danger, fontSize: 13 },
  loadingScreen: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12 },
  badge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
});
