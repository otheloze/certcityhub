import { resolveAttemptAccessPath } from "./org-access.util";

describe("resolveAttemptAccessPath", () => {
  it("is free for an active member attempting their own org's exam", () => {
    expect(
      resolveAttemptAccessPath({ examOrganizationId: "org-1", isActiveOrgMember: true, accessCodeProvided: false }),
    ).toBe("ORG_OWNED_FREE");
  });

  it("prefers ORG_OWNED_FREE even if an access code was also supplied", () => {
    expect(
      resolveAttemptAccessPath({ examOrganizationId: "org-1", isActiveOrgMember: true, accessCodeProvided: true }),
    ).toBe("ORG_OWNED_FREE");
  });

  it("is code-gated on a public exam when a code is supplied", () => {
    expect(
      resolveAttemptAccessPath({ examOrganizationId: null, isActiveOrgMember: false, accessCodeProvided: true }),
    ).toBe("ORG_GATED_CODE");
  });

  it("falls back to the standard credit path with no code and no org ownership", () => {
    expect(
      resolveAttemptAccessPath({ examOrganizationId: null, isActiveOrgMember: false, accessCodeProvided: false }),
    ).toBe("STANDARD_CREDIT");
  });

  it("is code-gated for an org exam when the requester is not an active member but supplied a code", () => {
    // The attempts.service.ts membership gate rejects non-members on org-owned
    // exams before this function is ever called for that case; this only
    // documents the function's own contract in isolation.
    expect(
      resolveAttemptAccessPath({ examOrganizationId: "org-1", isActiveOrgMember: false, accessCodeProvided: true }),
    ).toBe("ORG_GATED_CODE");
  });
});
