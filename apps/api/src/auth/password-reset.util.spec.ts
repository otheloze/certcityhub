import { generateResetCode } from "./password-reset.util";

describe("generateResetCode", () => {
  it("always returns a 6-digit numeric string", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateResetCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("pads small numbers with leading zeros", () => {
    const codes = Array.from({ length: 500 }, () => generateResetCode());
    expect(codes.some((c) => c.startsWith("0"))).toBe(true);
  });
});
