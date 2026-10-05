import Link from "next/link";
import { API_ORIGIN } from "../../lib/api-client";
import { fetchPublicTutors } from "../../lib/tutor-api";

export const metadata = { title: "Find a tutor" };

export default async function TutorsPage() {
  const tutors = await fetchPublicTutors().catch(() => []);

  return (
    <div className="container section-tight" style={{ paddingTop: "2.5rem" }}>
      <div className="section-head">
        <span className="eyebrow">Private tutors</span>
        <h1>Find a tutor</h1>
        <p>
          Verified tutors, reviewed before they're listed. Reach out directly — booking and payment happen
          between you and the tutor, outside this platform.
        </p>
      </div>
      {tutors.length === 0 ? (
        <div className="card empty">
          <strong style={{ color: "var(--text)" }}>No tutors are listed yet.</strong>
        </div>
      ) : (
        <div className="grid grid-3">
          {tutors.map((tutor) => (
            <Link key={tutor.id} href={`/tutors/${tutor.id}`} className="exam-card">
              <div className="exam-card-head">
                {tutor.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_ORIGIN}${tutor.photoUrl}`}
                    alt={tutor.displayName}
                    style={{ height: 48, width: 48, objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <span className="mono">{tutor.displayName.charAt(0).toUpperCase()}</span>
                )}
                <div style={{ minWidth: 0 }}>
                  <h3>{tutor.displayName}</h3>
                  {tutor.headline ? <div className="provider">{tutor.headline}</div> : null}
                </div>
              </div>
              <p>
                {tutor.specializations
                  .slice(0, 3)
                  .map((s) => (s.topicKeyword ? `${s.exam.title} — ${s.topicKeyword}` : s.exam.title))
                  .join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
