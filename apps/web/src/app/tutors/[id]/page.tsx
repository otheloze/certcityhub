import Link from "next/link";
import { notFound } from "next/navigation";
import { API_ORIGIN } from "../../../lib/api-client";
import { fetchPublicTutor } from "../../../lib/tutor-api";

export default async function TutorProfilePage({ params }: { params: { id: string } }) {
  const tutor = await fetchPublicTutor(params.id).catch(() => null);
  if (!tutor) {
    notFound();
  }

  return (
    <div className="container-narrow section-tight" style={{ paddingTop: "2.5rem" }}>
      <Link href="/tutors" className="back-link">
        ← Find a tutor
      </Link>

      <div className="row" style={{ gap: "1.25rem", alignItems: "center", marginBottom: "1.25rem" }}>
        {tutor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_ORIGIN}${tutor.photoUrl}`}
            alt={tutor.displayName}
            style={{ height: 96, width: 96, objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <span className="mono mono-lg">{tutor.displayName.charAt(0).toUpperCase()}</span>
        )}
        <div>
          <h1 style={{ marginBottom: "0.2rem" }}>{tutor.displayName}</h1>
          {tutor.headline ? <p style={{ margin: 0 }}>{tutor.headline}</p> : null}
        </div>
      </div>

      {tutor.bio ? (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{tutor.bio}</p>
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">
          <h2>Areas of specialization</h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {tutor.specializations.map((s) => (
            <li key={s.id}>
              {s.exam.title}
              {s.topicKeyword ? ` — ${s.topicKeyword}` : ""}
            </li>
          ))}
        </ul>
      </div>

      {tutor.resumeUrl ? (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <div className="card-title">
            <h2>Resume</h2>
          </div>
          <a href={`${API_ORIGIN}${tutor.resumeUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
            View resume
          </a>
        </div>
      ) : null}

      <p className="field-note">
        This platform does not handle booking, messaging or payment for tutoring — contact this tutor directly to
        arrange sessions.
      </p>
    </div>
  );
}
