import { Link } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { Card, ErrorText, Field, H1, Muted, PrimaryButton, Screen } from "../src/components/ui";
import { ApiError, requestPasswordReset } from "../src/lib/api-client";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError("Could not reach the server. Please try again in a moment.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>Forgot your password?</H1>
      <Muted>Enter the email you signed up with and we&apos;ll send you a reset code.</Muted>

      <Card>
        {sent ? (
          <Muted>If an account exists for that email, a reset code has been sent.</Muted>
        ) : (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <ErrorText>{error}</ErrorText>
            <PrimaryButton title="Send reset code" onPress={handleSubmit} loading={busy} disabled={!email} />
          </>
        )}
      </Card>

      {sent ? (
        <Text>
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`} style={{ color: "#3b82f6", fontWeight: "600" }}>
            I have my code →
          </Link>
        </Text>
      ) : null}

      <Text>
        <Link href="/login" style={{ color: "#3b82f6", fontWeight: "600" }}>
          Back to login
        </Link>
      </Text>
    </Screen>
  );
}
