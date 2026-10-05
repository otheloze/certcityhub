// Pure, DB-free decision of how a SIMULATION attempt on an org-related exam
// gets paid for. Kept separate from lot-selection.util.ts because it decides
// WHICH mechanism applies before any credit lot is even looked up.

export type AttemptAccessPath = "ORG_OWNED_FREE" | "ORG_GATED_CODE" | "STANDARD_CREDIT";

export function resolveAttemptAccessPath(input: {
  examOrganizationId: string | null;
  isActiveOrgMember: boolean;
  accessCodeProvided: boolean;
}): AttemptAccessPath {
  if (input.examOrganizationId && input.isActiveOrgMember) {
    return "ORG_OWNED_FREE";
  }
  if (input.accessCodeProvided) {
    return "ORG_GATED_CODE";
  }
  return "STANDARD_CREDIT";
}
