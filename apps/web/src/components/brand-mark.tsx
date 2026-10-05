import { BRAND_NAME } from "../lib/brand";

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12.5 9.5 18 20 6.5" />
      </svg>
    </span>
  );
}

export function BrandName() {
  return (
    <>
      <BrandMark />
      <span>{BRAND_NAME}</span>
    </>
  );
}
