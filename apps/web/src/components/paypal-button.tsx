"use client";

import { useEffect, useRef, useState } from "react";
import { capturePaypalOrder, createPaypalOrder } from "../lib/api-client";

// PayPal's JS SDK is loaded once and reused - rendering it again per
// button instance would redefine `window.paypal` and break any buttons
// already mounted on the page.
let sdkPromise: Promise<void> | null = null;

function loadPaypalSdk(clientId: string, currency: string): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
    script.dataset.paypalSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the PayPal SDK"));
    document.body.appendChild(script);
  });
  return sdkPromise;
}

// window.paypal is injected by the script above; no official types package
// for the vanilla JS SDK, so this stays loosely typed at the boundary.
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (container: HTMLElement) => void };
    };
  }
}

export function PaypalCheckoutButton({
  token,
  productId,
  currency,
  onSuccess,
}: {
  token: string;
  productId: string;
  currency: string;
  onSuccess: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal is not configured.");
      return;
    }
    let cancelled = false;

    loadPaypalSdk(clientId, currency)
      .then(() => {
        if (cancelled || !containerRef.current || !window.paypal) return;
        containerRef.current.innerHTML = "";
        window.paypal
          .Buttons({
            createOrder: async () => {
              try {
                const { orderId } = await createPaypalOrder(token, productId);
                return orderId;
              } catch (err) {
                setError(`Could not start checkout: ${err instanceof Error ? err.message : String(err)}`);
                throw err;
              }
            },
            // PayPal's SDK does not route a rejected onApprove promise to
            // onError - without this try/catch, a failed capture (or any
            // other error here) closes the popup with no visible error at
            // all, which is exactly what happened before this was added.
            onApprove: async (data: { orderID: string }) => {
              try {
                await capturePaypalOrder(token, productId, data.orderID);
                onSuccess();
              } catch (err) {
                setError(`Payment approved but could not be completed: ${err instanceof Error ? err.message : String(err)}`);
              }
            },
            onError: (err: unknown) => {
              setError(`PayPal checkout failed: ${err instanceof Error ? err.message : String(err)}`);
            },
            onCancel: () => {
              setError("Checkout was cancelled.");
            },
            style: { layout: "horizontal", height: 40, tagline: false },
          })
          .render(containerRef.current);
      })
      .catch(() => setError("Could not load PayPal."));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, productId, currency]);

  if (error) return <p role="alert" style={{ fontSize: "0.85rem", margin: 0 }}>{error}</p>;
  return <div ref={containerRef} />;
}
