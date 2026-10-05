import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, ErrorText, Field, H1, Muted, PrimaryButton, Screen } from "../src/components/ui";
import { ApiError, register, registerOrganization, registerTutor } from "../src/lib/api-client";
import { useAuth } from "../src/lib/auth-context";

type AccountType = "individual" | "organization" | "teacher";

const CHECKLIST: Record<AccountType, string[]> = {
  individual: [
    "Unlimited practice with instant feedback",
    "Free-plan exam simulation attempts",
    "Topic-level progress and a next-step recommendation",
    "Buy attempts only if you want more full simulations",
  ],
  organization: [
    "A dashboard to manage your members and their exam access",
    "Unlimited attempts on JAMB and WAEC for members you grant access to",
    "Upload your logo and write a mission statement",
    "Build your own private, custom exams over time",
  ],
  teacher: [
    "A public profile with your photo, resume and specializations",
    "Reviewed by our team before you go live, for students' trust",
    "Suggested to students automatically when your subject matches their weak topics",
    "No booking or payment handled here — students contact you directly",
  ],
};

export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (accountType === "organization") {
        const response = await registerOrganization(organizationName, email, password);
        setSession(response.accessToken, response.user);
        router.replace("/org");
      } else if (accountType === "teacher") {
        const response = await registerTutor(displayName, email, password);
        setSession(response.accessToken, response.user);
        router.replace("/tutor");
      } else {
        const response = await register(email, password);
        setSession(response.accessToken, response.user);
        router.replace("/exams");
      }
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 409) {
        setError("That email is already registered. Try logging in instead.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Could not create your account. Check your details and try again.");
      }
    }
  }

  const canSubmit =
    email.length > 0 &&
    password.length >= 8 &&
    (accountType !== "organization" || organizationName.length >= 2) &&
    (accountType !== "teacher" || displayName.length >= 2);

  return (
    <Screen>
      <H1>Create your account</H1>
      <Muted>
        {accountType === "organization"
          ? "Set up your organization, then provision member accounts and grant them exam access from your own dashboard."
          : accountType === "teacher"
            ? "Build a verified tutor profile, and get suggested to students whose exam results show they need help in your subject."
            : "Free-plan attempts are included, and practice is unlimited. No card needed."}
      </Muted>
      <View style={{ gap: 4 }}>
        {CHECKLIST[accountType].map((line) => (
          <Muted key={line}>• {line}</Muted>
        ))}
      </View>

      <Card>
        <View style={chipStyles.row}>
          {(["individual", "organization", "teacher"] as AccountType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setAccountType(type)}
              style={[chipStyles.chip, accountType === type && chipStyles.chipActive]}
            >
              <Text style={[chipStyles.chipText, accountType === type && chipStyles.chipTextActive]}>
                {type === "individual" ? "Individual" : type === "organization" ? "Organization" : "Teacher"}
              </Text>
            </Pressable>
          ))}
        </View>

        {accountType === "organization" ? (
          <Field label="Organization name" value={organizationName} onChangeText={setOrganizationName} autoComplete="organization" />
        ) : null}
        {accountType === "teacher" ? (
          <Field label="Your name" value={displayName} onChangeText={setDisplayName} autoComplete="name" />
        ) : null}
        <Field
          label={accountType === "organization" ? "Administrator email" : "Email"}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field label="Password (at least 8 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton
          title={
            busy
              ? "Creating account…"
              : accountType === "organization"
                ? "Create organization account"
                : accountType === "teacher"
                  ? "Create tutor account"
                  : "Create free account"
          }
          onPress={handleSubmit}
          loading={busy}
          disabled={!canSubmit}
        />
      </Card>

      <Text>
        <Muted>Already registered? </Muted>
        <Link href="/login" style={{ color: colors.primary, fontWeight: "600" }}>
          Log in
        </Link>
      </Text>
    </Screen>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 4 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
});
