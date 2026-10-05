import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { Card, ErrorText, Field, H1, Muted, PrimaryButton, Screen } from "../src/components/ui";
import { ApiError, login } from "../src/lib/api-client";
import { useAuth } from "../src/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      const response = await login(email, password);
      setSession(response.accessToken, response.user);
      if (response.user.role === "ORG_ADMIN") router.replace("/org");
      else if (response.user.role === "TUTOR") router.replace("/tutor");
      else router.replace("/dashboard");
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Could not reach the server. Please try again in a moment.");
      }
    }
  }

  return (
    <Screen>
      <H1>Welcome back</H1>
      <Muted>Your scores, weak topics and attempt credits are waiting.</Muted>

      <Card>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton title="Log in" onPress={handleSubmit} loading={busy} disabled={!email || !password} />
      </Card>

      <Text>
        <Muted>New here? </Muted>
        <Link href="/register" style={{ color: "#3b82f6", fontWeight: "600" }}>
          Create a free account
        </Link>
      </Text>
    </Screen>
  );
}
