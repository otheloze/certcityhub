import { authFetch, apiFetch } from "./api-client";

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

export const updateMyTutorProfile = (
  token: string,
  body: { displayName?: string; headline?: string; bio?: string },
) => authFetch<TutorProfile>(token, "/tutors/me", { method: "PATCH", body: JSON.stringify(body) });

async function uploadTutorFile(token: string, path: string, fieldName: string, file: File) {
  const form = new FormData();
  form.append(fieldName, file);
  // Not JSON, so this deliberately doesn't go through the shared apiFetch/authFetch
  // helpers (which always set Content-Type: application/json).
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").replace(/\/$/, "");
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

export const uploadTutorPhoto = (token: string, file: File) =>
  uploadTutorFile(token, "/tutors/me/photo", "photo", file) as Promise<TutorProfile>;

export const uploadTutorResume = (token: string, file: File) =>
  uploadTutorFile(token, "/tutors/me/resume", "resume", file) as Promise<TutorProfile>;

export const fetchMySpecializations = (token: string) =>
  authFetch<TutorSpecializationView[]>(token, "/tutors/me/specializations");

export const addMySpecialization = (token: string, body: { examSlug: string; topicKeyword?: string }) =>
  authFetch<TutorSpecializationView>(token, "/tutors/me/specializations", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const removeMySpecialization = (token: string, id: string) =>
  authFetch<void>(token, `/tutors/me/specializations/${id}`, { method: "DELETE" });

export const submitTutorProfile = (token: string) =>
  authFetch<TutorProfile>(token, "/tutors/me/submit", { method: "POST" });

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
  authFetch<AdminTutorProfile>(token, `/admin/tutors/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
