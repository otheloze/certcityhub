import { randomSlugSuffix, slugify } from "./org-slug.util";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Bright Future Academy")).toBe("bright-future-academy");
  });

  it("strips punctuation and collapses repeated separators", () => {
    expect(slugify("St. Mary's  --  College!!")).toBe("st-mary-s-college");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -Test Org- ")).toBe("test-org");
  });

  it("falls back to a default when the name has no usable characters", () => {
    expect(slugify("!!!")).toBe("org");
  });
});

describe("randomSlugSuffix", () => {
  it("returns a short alphanumeric string", () => {
    expect(randomSlugSuffix()).toMatch(/^[a-z0-9]{1,4}$/);
  });
});
