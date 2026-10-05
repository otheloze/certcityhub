import { Redirect, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, EmbossedTitle, LoadingScreen, PrimaryButton, SecondaryButton } from "../src/components/ui";
import { BRAND_TAGLINE } from "../src/lib/brand";
import { useAuth } from "../src/lib/auth-context";

function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <EmbossedTitle size={48}>CERTCITY</EmbossedTitle>
        <Text style={styles.tagline}>{BRAND_TAGLINE.toUpperCase()}</Text>
        <Text style={styles.sub}>
          Practice with instant feedback, simulate the real exam under real timing, and track exactly where you're
          weak - across every certification and exam board we support.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Get started free" onPress={() => router.push("/register")} />
        <SecondaryButton title="Log in" onPress={() => router.push("/login")} />
      </View>
    </View>
  );
}

export default function Index() {
  const { ready, user } = useAuth();

  if (!ready) {
    return <LoadingScreen label="Loading your session…" />;
  }
  if (!user) {
    return <WelcomeScreen />;
  }
  if (user.role === "ORG_ADMIN") {
    return <Redirect href="/org" />;
  }
  if (user.role === "TUTOR") {
    return <Redirect href="/tutor" />;
  }
  return <Redirect href="/dashboard" />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: "space-between", padding: 28, paddingTop: 100, paddingBottom: 48 },
  hero: { alignItems: "center", gap: 18 },
  tagline: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 4,
  },
  sub: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 340,
  },
  actions: { gap: 12 },
});
