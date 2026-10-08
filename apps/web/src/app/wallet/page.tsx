"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import {
  ApiError,
  CreditTransactionView,
  Product,
  Wallet,
  fetchProducts,
  fetchTransactions,
  fetchWallet,
  formatPrice,
  purchaseProduct,
} from "../../lib/api-client";
import { PaypalCheckoutButton } from "../../components/paypal-button";

const PAYPAL_ENABLED = Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID);

const REASON_LABEL: Record<CreditTransactionView["reason"], string> = {
  GRANT: "Attempts added",
  EXAM_STARTED: "Exam started",
  ADMIN_REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Adjustment",
};

function scopeLabel(lot: { scopeType: string; examTitle?: string | null }) {
  return lot.scopeType === "EXAM" ? (lot.examTitle ?? "One exam") : "All exams";
}

function sourceLabel(source: string) {
  return source === "FREE_PLAN" ? "Free plan" : source === "PURCHASE" ? "Purchased" : "Granted";
}

export default function WalletPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionView[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [w, t, p] = await Promise.all([fetchWallet(token), fetchTransactions(token), fetchProducts()]);
      setWallet(w);
      setTransactions(t);
      setProducts(p);
    } catch {
      setError("Could not load your wallet.");
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
      return;
    }
    load();
  }, [ready, token, router, load]);

  async function buy(product: Product) {
    if (!token) return;
    setBuying(product.id);
    setError(null);
    setNotice(null);
    try {
      await purchaseProduct(token, product.id);
      setNotice(`Added ${product.credits} attempt${product.credits === 1 ? "" : "s"} (${product.name}). Sandbox checkout: no real payment was taken.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 0 ? "Could not reach the server." : "The purchase could not be completed.");
    } finally {
      setBuying(null);
    }
  }

  async function onPaypalSuccess(product: Product) {
    setNotice(`Added ${product.credits} attempt${product.credits === 1 ? "" : "s"} (${product.name}) via PayPal.`);
    setError(null);
    await load();
  }

  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="section-head">
        <span className="eyebrow">Wallet</span>
        <h1>Your exam attempts</h1>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}

      <div className="dash-hero" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="stat-value" style={{ fontSize: "2.6rem" }}>
            {wallet ? (wallet.unlimited ? "∞" : wallet.total) : "…"}
          </div>
          <div className="stat-label" style={{ marginBottom: "0.75rem" }}>
            {wallet?.unlimited ? "unlimited attempts" : "attempts remaining"}
          </div>
          <p style={{ marginBottom: 0 }}>
            One attempt is used each time you start a full exam simulation. Practice, results, review and browsing are always free.
          </p>
        </div>
        <div className="card">
          <h3>Need more?</h3>
          <p>Attempt packs are a one-off purchase with no subscription. This checkout runs in sandbox mode, so no real payment is taken.</p>
          <a href="#packs" className="btn btn-primary">
            See attempt packs
          </a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <h2>Your credits</h2>
        </div>
        {wallet && wallet.lots.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>For</th>
                  <th>Left</th>
                  <th>Source</th>
                  <th>Exam size</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {wallet.lots.map((lot) => (
                  <tr key={lot.id}>
                    <td>{scopeLabel(lot)}</td>
                    <td>{lot.unlimited ? <strong>Unlimited</strong> : <><strong>{lot.remaining}</strong> / {lot.granted}</>}</td>
                    <td>{sourceLabel(lot.source)}</td>
                    <td>{lot.questionFraction < 1 ? `${Math.round(lot.questionFraction * 100)}% of questions` : "Full exam"}</td>
                    <td>{lot.expiresAt ? new Date(lot.expiresAt).toLocaleDateString() : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : wallet ? (
          <p className="empty" style={{ margin: 0 }}>
            You have no attempts right now. Choose a pack below, or <Link href="/exams">practise for free</Link>.
          </p>
        ) : (
          <p>Loading…</p>
        )}
      </div>

      <section id="packs" style={{ marginBottom: "1.5rem" }}>
        <h2>Attempt packs</h2>
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="card price-card">
              <strong>{product.name}</strong>
              <div className="price">{formatPrice(product.priceCents, product.currency)}</div>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                {product.unlimited ? "Unlimited" : product.credits} attempt{product.unlimited || product.credits === 1 ? "" : "s"} ·{" "}
                {product.scopeType === "EXAM" ? "one exam" : "all exams"}
                {product.validityDays ? ` · valid ${product.validityDays} days` : " · never expire"}
              </p>
              {product.code === "FREE" ? (
                <span className="field-note" style={{ marginTop: "auto" }}>
                  Included automatically when you sign up
                </span>
              ) : PAYPAL_ENABLED && token ? (
                <div style={{ marginTop: "auto" }}>
                  <PaypalCheckoutButton
                    token={token}
                    productId={product.id}
                    currency={product.currency}
                    onSuccess={() => onPaypalSuccess(product)}
                  />
                </div>
              ) : (
                <button type="button" className="btn btn-primary" disabled={buying !== null} onClick={() => buy(product)} style={{ marginTop: "auto" }}>
                  {buying === product.id ? "Processing…" : "Buy now (sandbox)"}
                </button>
              )}
            </div>
          ))}
          {products.length === 0 ? <p>No packs are available yet.</p> : null}
        </div>
      </section>

      <div className="card">
        <div className="card-title">
          <h2>History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="empty" style={{ margin: 0 }}>
            No activity yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>What</th>
                  <th>Change</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{REASON_LABEL[tx.reason]}</td>
                    <td className={tx.amount < 0 ? "neg" : "pos"}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount}</td>
                    <td>{tx.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
