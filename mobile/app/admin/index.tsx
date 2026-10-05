import { Redirect, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, H1, H2, LoadingScreen, Muted, Screen } from "../../src/components/ui";
import { useAuth } from "../../src/lib/auth-context";

const CARDS: { href: "/admin/exams" | "/admin/credits" | "/admin/audit" | "/admin/tutors"; title: string; detail: string }[] = [
  { href: "/admin/exams", title: "Exams & content", detail: "Create exams and versions, build topic trees, review questions." },
  { href: "/admin/credits", title: "Credits & pricing", detail: "Grant or adjust user credits, refund attempts." },
  { href: "/admin/audit", title: "Audit log", detail: "Every content and credit change, with who made it and why." },
  { href: "/admin/tutors", title: "Tutors", detail: "Review submitted tutor profiles before they go live." },
];

export default function AdminHomeScreen() {
  const router = useRouter();
  const { token, ready, logout } = useAuth();

  if (!ready) return <LoadingScreen />;
  if (!token) return <Redirect href="/login" />;

  return (
    <Screen>
      <H1>Administration</H1>
      {CARDS.map((c) => (
        <Pressable key={c.href} onPress={() => router.push(c.href)} style={styles.card}>
          <H2>{c.title}</H2>
          <Muted>{c.detail}</Muted>
        </Pressable>
      ))}
      <Pressable
        onPress={() => {
          logout();
          router.replace("/login");
        }}
        style={styles.card}
      >
        <Text style={{ color: colors.danger, fontWeight: "700" }}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 6 },
});
