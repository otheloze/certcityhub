import { useRouter } from "expo-router";

import { Card, H1, Muted, PrimaryButton, Screen } from "../src/components/ui";

export default function PaypalCancelScreen() {
  const router = useRouter();
  return (
    <Screen>
      <H1>PayPal checkout</H1>
      <Card>
        <Muted>Checkout was cancelled. No payment was taken.</Muted>
      </Card>
      <PrimaryButton title="Back to wallet" onPress={() => router.replace("/wallet")} />
    </Screen>
  );
}
