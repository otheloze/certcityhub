import { generateAccessCode, generateTempPassword, hashAccessCode } from "./org-secrets.util";

describe("generateAccessCode", () => {
  it("produces an 8-character code split into two groups of 4", () => {
    const code = generateAccessCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("excludes visually ambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateAccessCode()).not.toMatch(/[01OI]/);
    }
  });

  it("is not obviously constant across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateAccessCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("hashAccessCode", () => {
  it("is deterministic for the same code", () => {
    expect(hashAccessCode("K7X9-MQ3P")).toBe(hashAccessCode("K7X9-MQ3P"));
  });

  it("normalises case and surrounding whitespace before hashing", () => {
    expect(hashAccessCode(" k7x9-mq3p ")).toBe(hashAccessCode("K7X9-MQ3P"));
  });

  it("produces different hashes for different codes", () => {
    expect(hashAccessCode("K7X9-MQ3P")).not.toBe(hashAccessCode("K7X9-MQ3Q"));
  });
});

describe("generateTempPassword", () => {
  it("produces a reasonably long password with no padding characters", () => {
    const pw = generateTempPassword();
    expect(pw.length).toBe(12);
    expect(pw).not.toMatch(/[+/=]/);
  });
});
