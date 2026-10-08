import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface PaypalCaptureResult {
  ok: boolean;
  providerRef?: string;
  failureReason?: string;
}

// Talks to PayPal's REST API directly (no SDK dependency). Order creation
// always derives the amount from our own Product record, never from the
// client, and captureOrder re-checks the captured amount against that same
// expected value - PayPal's REST API technically lets a client-supplied
// order id be captured regardless of who created it, so this is what
// actually makes it safe to trust the browser's "payment approved" signal.
@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiBase: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>("PAYPAL_CLIENT_ID") ?? "";
    this.clientSecret = this.configService.get<string>("PAYPAL_CLIENT_SECRET") ?? "";
    this.apiBase = this.configService.get<string>("PAYPAL_API_BASE") ?? "https://api-m.sandbox.paypal.com";
  }

  get configured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  private async getAccessToken(): Promise<string> {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`PayPal OAuth failed (${response.status}): ${text}`);
      throw new Error("Could not authenticate with PayPal");
    }
    const body = (await response.json()) as { access_token: string };
    return body.access_token;
  }

  // returnUrl/cancelUrl are for the mobile app, which has no JS SDK popup to
  // drive the approval flow - it opens `approveUrl` in a browser and relies
  // on PayPal redirecting back to one of these afterward. The web app's
  // Buttons SDK handles approval entirely in its own popup and passes
  // neither, so `application_context` is only included when at least one is
  // set.
  async createOrder(
    amountCents: number,
    currency: string,
    description: string,
    redirect?: { returnUrl: string; cancelUrl: string },
  ): Promise<{ orderId: string; approveUrl?: string }> {
    const token = await this.getAccessToken();
    const amount = (amountCents / 100).toFixed(2);
    const response = await fetch(`${this.apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: currency, value: amount }, description }],
        ...(redirect
          ? { application_context: { return_url: redirect.returnUrl, cancel_url: redirect.cancelUrl } }
          : {}),
      }),
    });
    const body = (await response.json()) as { id: string; links?: { rel: string; href: string }[] };
    if (!response.ok) {
      this.logger.error(`PayPal order creation failed: ${JSON.stringify(body)}`);
      throw new Error("Could not create PayPal order");
    }
    const approveUrl = body.links?.find((l) => l.rel === "approve")?.href;
    return { orderId: body.id, approveUrl };
  }

  async captureOrder(orderId: string, expectedAmountCents: number, expectedCurrency: string): Promise<PaypalCaptureResult> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const body = (await response.json()) as {
      message?: string;
      purchase_units?: { payments?: { captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[] } }[];
    };
    if (!response.ok) {
      return { ok: false, failureReason: body.message ?? `PayPal capture failed with status ${response.status}` };
    }

    const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== "COMPLETED") {
      return { ok: false, failureReason: `Unexpected capture status: ${capture?.status ?? "unknown"}` };
    }

    const capturedAmountCents = Math.round(parseFloat(capture.amount.value) * 100);
    const capturedCurrency = capture.amount.currency_code;
    if (capturedAmountCents !== expectedAmountCents || capturedCurrency !== expectedCurrency) {
      this.logger.error(
        `PayPal capture amount mismatch: expected ${expectedAmountCents} ${expectedCurrency}, got ${capturedAmountCents} ${capturedCurrency}`,
      );
      return { ok: false, failureReason: "Captured amount did not match the expected price" };
    }

    return { ok: true, providerRef: capture.id };
  }
}
