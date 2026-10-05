import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../src/lib/auth-context";
import { colors } from "../src/components/ui";

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "Log in" }} />
            <Stack.Screen name="register" options={{ title: "Create account" }} />
            <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Stack.Screen name="wallet" options={{ title: "Wallet" }} />
            <Stack.Screen name="exams/index" options={{ title: "Exams" }} />
            <Stack.Screen name="exams/[slug]" options={{ title: "Exam" }} />
            <Stack.Screen name="attempts/[id]/index" options={{ title: "Attempt", headerBackVisible: false }} />
            <Stack.Screen name="attempts/[id]/result" options={{ title: "Result" }} />
            <Stack.Screen name="attempts/[id]/review" options={{ title: "Review" }} />
            <Stack.Screen name="tutors/index" options={{ title: "Find a tutor" }} />
            <Stack.Screen name="tutors/[id]" options={{ title: "Tutor profile" }} />
            <Stack.Screen name="tutor/index" options={{ title: "Tutor profile" }} />
            <Stack.Screen name="org/index" options={{ title: "Organization" }} />
            <Stack.Screen name="org/members" options={{ title: "Members" }} />
            <Stack.Screen name="org/exams" options={{ title: "Exam access" }} />
            <Stack.Screen name="admin/index" options={{ title: "Admin" }} />
            <Stack.Screen name="admin/credits" options={{ title: "Credits & pricing" }} />
            <Stack.Screen name="admin/tutors" options={{ title: "Tutor moderation" }} />
            <Stack.Screen name="admin/exams" options={{ title: "Exams & content" }} />
            <Stack.Screen name="admin/versions/[id]" options={{ title: "Version" }} />
            <Stack.Screen name="admin/audit" options={{ title: "Audit log" }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
