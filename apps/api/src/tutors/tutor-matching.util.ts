// Pure, DB-free matching between a student's weak topics and tutors'
// specializations. Deliberately keyed on (examSlug, free-text keyword), not
// a Topic id - topics are re-created per ExamVersion on every republish, so
// a raw Topic FK would silently go stale. See the schema comment on
// TutorSpecialization for the full rationale.

export interface WeakTopic {
  topicId: string;
  title: string;
  examSlug: string;
  examTitle: string;
}

export interface TutorSpecializationRef {
  id: string;
  examSlug: string;
  topicKeyword: string | null;
}

export interface TutorRef {
  id: string;
  displayName: string;
  headline: string | null;
  photoUrl: string | null;
  specializations: TutorSpecializationRef[];
}

export interface TutorSuggestion {
  tutorId: string;
  displayName: string;
  headline: string | null;
  photoUrl: string | null;
  matchedTopic: { topicId: string; title: string; examTitle: string };
}

export function matchesWeakTopic(spec: TutorSpecializationRef, weakTopic: WeakTopic): boolean {
  if (spec.examSlug !== weakTopic.examSlug) return false;
  if (spec.topicKeyword === null || spec.topicKeyword.trim() === "") return true;
  const keyword = spec.topicKeyword.trim().toLowerCase();
  return weakTopic.title.toLowerCase().includes(keyword) || keyword.includes(weakTopic.title.toLowerCase());
}

// One suggestion per tutor (their best/first matching weak topic), ordered
// to follow the caller's weakTopics ordering (already weakest-first),
// capped so the dashboard card never becomes a wall of names.
export function rankMatches(tutors: TutorRef[], weakTopics: WeakTopic[], limit = 3): TutorSuggestion[] {
  const suggestions: TutorSuggestion[] = [];
  const seenTutorIds = new Set<string>();

  for (const weakTopic of weakTopics) {
    for (const tutor of tutors) {
      if (seenTutorIds.has(tutor.id)) continue;
      const matched = tutor.specializations.some((spec) => matchesWeakTopic(spec, weakTopic));
      if (!matched) continue;

      seenTutorIds.add(tutor.id);
      suggestions.push({
        tutorId: tutor.id,
        displayName: tutor.displayName,
        headline: tutor.headline,
        photoUrl: tutor.photoUrl,
        matchedTopic: { topicId: weakTopic.topicId, title: weakTopic.title, examTitle: weakTopic.examTitle },
      });
      if (suggestions.length >= limit) return suggestions;
    }
  }

  return suggestions;
}
