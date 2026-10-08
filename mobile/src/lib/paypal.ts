import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { capturePaypalOrder, createPaypalOrder } from "./api-client";

export type PaypalCheckoutResult =
  | { status: "success"; purchase: { id: string; status: string } }
  | { status: "cancelled" }
  | { status: "error"; message: string };

// Finishes a PayPal checkout once we have the order id back - called from
// both app/paypal-return.tsx (the real redirect target; PayPal's redirect on
// Android lands there as a normal app navigation rather than being
// intercepted by openAuthSessionAsync below) and, best-effort, from
// checkoutWithPaypal itself on platforms where openAuthSessionAsync *does*
// intercept it (iOS). A second capture attempt on an already-captured order
// just fails cleanly on PayPal's side, so calling this from both places is
// safe, not a double-charge risk.
export async function completePaypalOrder(token: string, productId: string, orderId: string): Promise<PaypalCheckoutResult> {
  try {
    const { purchase } = await capturePaypalOrder(token, productId, orderId);
    return { status: "success", purchase };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Payment approved but could not be completed." };
  }
}

// No JS SDK popup on mobile - PayPal only has a hosted checkout page, so
// this opens it in an in-app browser. productId travels in the return URL's
// own query params (ours, set below) alongside the token/PayerID PayPal adds
// itself, since app/paypal-return.tsx needs it and has no other way to know
// which product this checkout was for.
export async function checkoutWithPaypal(token: string, productId: string): Promise<PaypalCheckoutResult> {
  const returnUrl = Linking.createURL("paypal-return", { queryParams: { productId } });
  const cancelUrl = Linking.createURL("paypal-cancel");

  let approveUrl: string;
  try {
    const order = await createPaypalOrder(token, productId, returnUrl, cancelUrl);
    if (!order.approveUrl) {
      return { status: "error", message: "PayPal did not return an approval link." };
    }
    approveUrl = order.approveUrl;
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Could not start PayPal checkout." };
  }

  const result = await WebBrowser.openAuthSessionAsync(approveUrl, returnUrl);

  // "dismiss" on Android commonly means the OS handed the redirect to the
  // app as a real navigation (to paypal-return) instead of resolving here -
  // that screen handles completion in that case, so this isn't necessarily
  // a cancellation. Only "cancel" (the buyer closed the browser themselves)
  // is a genuine cancel.
  if (result.type === "cancel") {
    return { status: "cancelled" };
  }
  if (result.type !== "success") {
    return { status: "cancelled" };
  }

  const orderId = Linking.parse(result.url).queryParams?.token;
  if (!orderId || typeof orderId !== "string") {
    return { status: "error", message: "PayPal did not return an order reference." };
  }
  return completePaypalOrder(token, productId, orderId);
}
