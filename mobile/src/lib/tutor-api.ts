import Constants from "expo-constants";
import { Platform } from "react-native";

import { apiFetch, authFetch } from "./api-client";

export type TutorProfileStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface TutorSpecializationView {
  id: string;
  examId: string;
  topicKeyword: string | null;
  exam: { slug: string; title: string };
}

export interface TutorProfile {
  id: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  status: TutorProfileStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  specializations: TutorSpecializationView[];
}

export interface PublicTutor {
  id: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  createdAt: string;
  specializations: TutorSpecializationView[];
}

export const fetchMyTutorProfile = (token: string) => authFetch<TutorProfile>(token, "/tutors/me");

export const updateMyTutorProfile = (token: string, body: { displayName?: string; headline?: string; bio?: string }) =>
  authFetch<TutorProfile>(token, "/tutors/me", { method: "PATCH", body: JSON.stringify(body) });

// A file picked via expo-image-picker/expo-document-picker: a local file URI
// plus the name/mime-type the server needs, not a web File/Blob.
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

async function uploadTutorFile(token: string, path: string, fieldName: string, file: PickedFile) {
  const form = new FormData();
  if (Platform.OS === "web") {
    // The DOM's real FormData needs an actual Blob - expo-image-picker/
    // expo-document-picker's web implementation returns a blob: URL, so
    // fetch it back into a Blob before appending.
    const blob = await (await fetch(file.uri)).blob();
    form.append(fieldName, blob, file.name);
  } else {
    // React Native's FormData accepts this {uri, name, type} shape directly
    // (not a real Blob) - its fetch/FormData implementation knows how to
    // stream it from the local file URI.
    form.append(fieldName, { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }
  const base = ((Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:3001/api").replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
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

export const uploadTutorPhoto = (token: string, file: PickedFile) =>
  uploadTutorFile(token, "/tutors/me/photo", "photo", file) as Promise<TutorProfile>;

export const uploadTutorResume = (token: string, file: PickedFile) =>
  uploadTutorFile(token, "/tutors/me/resume", "resume", file) as Promise<TutorProfile>;

export const fetchMySpecializations = (token: string) => authFetch<TutorSpecializationView[]>(token, "/tutors/me/specializations");

export const addMySpecialization = (token: string, body: { examSlug: string; topicKeyword?: string }) =>
  authFetch<TutorSpecializationView>(token, "/tutors/me/specializations", { method: "POST", body: JSON.stringify(body) });

export const removeMySpecialization = (token: string, id: string) =>
  authFetch<void>(token, `/tutors/me/specializations/${id}`, { method: "DELETE" });

export const submitTutorProfile = (token: string) => authFetch<TutorProfile>(token, "/tutors/me/submit", { method: "POST" });

export const fetchPublicTutors = (examSlug?: string) =>
  apiFetch<PublicTutor[]>(`/tutors${examSlug ? `?examSlug=${encodeURIComponent(examSlug)}` : ""}`);

export const fetchPublicTutor = (id: string) => apiFetch<PublicTutor>(`/tutors/${id}`);

export interface AdminTutorProfile extends TutorProfile {
  user: { email: string };
}

export const fetchAdminTutors = (token: string, status?: TutorProfileStatus) =>
  authFetch<AdminTutorProfile[]>(token, `/admin/tutors${status ? `?status=${status}` : ""}`);

export const approveAdminTutor = (token: string, id: string) =>
  authFetch<AdminTutorProfile>(token, `/admin/tutors/${id}/approve`, { method: "POST" });

export const rejectAdminTutor = (token: string, id: string, reason: string) =>
  authFetch<AdminTutorProfile>(token, `/admin/tutors/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
