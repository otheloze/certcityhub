import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { Card, ErrorText, H1, LoadingScreen, Muted, PrimaryButton, Screen } from "../src/components/ui";
import { useAuth } from "../src/lib/auth-context";
import { completePaypalOrder } from "../src/lib/paypal";

// The real target of the PayPal redirect - on Android this is reached as a
// normal app navigation (not intercepted by openAuthSessionAsync the way it
// is on iOS), so this screen - not checkoutWithPaypal's own result handling
// - is what actually completes the purchase in practice. See paypal.ts.
export default function PaypalReturnScreen() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const { productId, token: orderId } = useLocalSearchParams<{ productId: string; token: string }>();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    if (!productId || !orderId) {
      setState("error");
      setMessage("Missing order details from PayPal's redirect.");
      return;
    }
    completePaypalOrder(token, productId, orderId).then((result) => {
      if (result.status === "success") {
        setState("done");
      } else {
        setState("error");
        setMessage(result.status === "error" ? result.message : "Checkout was not completed.");
      }
    });
  }, [ready, token, productId, orderId]);

  if (!ready) return <LoadingScreen />;

  return (
    <Screen>
      <H1>PayPal checkout</H1>
      <Card>
        {state === "working" ? (
          <Muted>Finishing your purchase…</Muted>
        ) : state === "done" ? (
          <Muted>Payment successful - your attempts have been added.</Muted>
        ) : (
          <ErrorText>{message}</ErrorText>
        )}
      </Card>
      <PrimaryButton title="Back to wallet" onPress={() => router.replace("/wallet")} />
    </Screen>
  );
}
