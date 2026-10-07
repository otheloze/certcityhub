import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { Card, ErrorText, Field, H1, Muted, PrimaryButton, Screen } from "../src/components/ui";
import { ApiError, confirmPasswordReset } from "../src/lib/api-client";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await confirmPasswordReset(email, code, newPassword);
      router.replace("/login");
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Invalid or expired code. Please try again or request a new code.");
      }
    }
  }

  const canSubmit = !!email && /^\d{6}$/.test(code) && newPassword.length >= 8 && !!confirmPassword;

  return (
    <Screen>
      <H1>Reset your password</H1>
      <Muted>Enter the 6-digit code we emailed you, along with your new password.</Muted>

      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label="Reset code"
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
        <Field
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton title="Reset password" onPress={handleSubmit} loading={busy} disabled={!canSubmit} />
      </Card>

      <Text>
        <Link href="/forgot-password" style={{ color: "#3b82f6", fontWeight: "600" }}>
          Request a new code
        </Link>
      </Text>
    </Screen>
  );
}
