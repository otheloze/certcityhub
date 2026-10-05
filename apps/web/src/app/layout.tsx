import { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";
import { SiteShell } from "../components/site-shell";
import { BRAND_NAME, BRAND_TAGLINE } from "../lib/brand";
import "./globals.css";

export const metadata = {
  title: { default: `${BRAND_NAME} — exam practice & simulation`, template: `%s · ${BRAND_NAME}` },
  description: BRAND_TAGLINE,
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
