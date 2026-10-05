import Constants from "expo-constants";
import { Platform } from "react-native";

import { authFetch } from "./api-client";
import { PickedFile } from "./tutor-api";

export interface OrgProfile {
  id: string;
  slug: string;
  name: string;
  missionStatement: string | null;
  logoUrl: string | null;
  allowedExamSlugs: string[];
  memberCount: number;
  examCount: number;
}

export type AccessCodeStatus = "UNUSED" | "USED" | "REVOKED";

export interface OrgMember {
  id: string;
  email: string;
  displayName: string | null;
  externalRef: string | null;
  orgRole: "ORG_ADMIN" | "ORG_MEMBER";
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
  access: { id: string; examId: string; status: AccessCodeStatus }[];
}

export interface OrgExam {
  id: string;
  slug: string;
  title: string;
  status: string;
}

export const fetchMyOrg = (token: string) => authFetch<OrgProfile>(token, "/organizations/me");

export const updateMyOrg = (token: string, body: { missionStatement?: string; allowedExamSlugs?: string[] }) =>
  authFetch<OrgProfile>(token, "/organizations/me", { method: "PATCH", body: JSON.stringify(body) });

export async function uploadOrgLogo(token: string, file: PickedFile): Promise<OrgProfile> {
  const form = new FormData();
  if (Platform.OS === "web") {
    // The DOM's real FormData needs an actual Blob - expo-image-picker's web
    // implementation returns a blob: URL, so fetch it back into a Blob first.
    const blob = await (await fetch(file.uri)).blob();
    form.append("logo", blob, file.name);
  } else {
    form.append("logo", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }
  const base = ((Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:3001/api").replace(/\/$/, "");
  const response = await fetch(`${base}/organizations/me/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(Array.isArray(body.message) ? body.message.join("; ") : (body.message ?? "Upload failed"));
  }
  return response.json();
}

export const fetchOrgMembers = (token: string) => authFetch<OrgMember[]>(token, "/organizations/me/members");

export const addOrgMember = (token: string, body: { email: string; displayName?: string; externalRef?: string }) =>
  authFetch<{ member: OrgMember; temporaryPassword: string }>(token, "/organizations/me/members", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const revokeOrgMember = (token: string, memberId: string) =>
  authFetch<OrgMember>(token, `/organizations/me/members/${memberId}`, { method: "DELETE" });

export const issueOrgAccess = (token: string, memberId: string, examSlug: string) =>
  authFetch<{ code: string }>(token, `/organizations/me/members/${memberId}/access`, {
    method: "POST",
    body: JSON.stringify({ examSlug }),
  });

export const revokeOrgAccess = (token: string, codeId: string) =>
  authFetch<void>(token, `/organizations/me/access/${codeId}/revoke`, { method: "POST" });

export const fetchOrgExams = (token: string) => authFetch<OrgExam[]>(token, "/organizations/me/exams");

export const createOrgExam = (token: string, body: { slug: string; title: string; description?: string }) =>
  authFetch<OrgExam>(token, "/organizations/me/exams", { method: "POST", body: JSON.stringify(body) });
