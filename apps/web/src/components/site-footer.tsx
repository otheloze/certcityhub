import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE, LEGAL_DISCLAIMER } from "../lib/brand";
import { BrandName } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: "0.6rem" }}>
              <BrandName />
            </div>
            <p style={{ maxWidth: 320, fontSize: "0.9rem" }}>{BRAND_TAGLINE}.</p>
          </div>
          <div>
            <h4>Prepare</h4>
            <ul>
              <li>
                <Link href="/exams">All exams</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/#how-it-works">How it works</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Your account</h4>
            <ul>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/wallet">Wallet</Link>
              </li>
              <li>
                <Link href="/login">Log in</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li>
                <Link href="/pricing#faq">FAQ</Link>
              </li>
              <li>
                <Link href="/register">Create account</Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="footer-legal">
          © {new Date().getFullYear()} {BRAND_NAME}. {LEGAL_DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
