import { matchesWeakTopic, rankMatches, TutorRef, WeakTopic } from "./tutor-matching.util";

const weakTopic = (over: Partial<WeakTopic> = {}): WeakTopic => ({
  topicId: "t1",
  title: "Mathematics",
  examSlug: "jamb-utme",
  examTitle: "JAMB UTME Practice",
  ...over,
});

describe("matchesWeakTopic", () => {
  it("does not match a different exam regardless of keyword", () => {
    expect(matchesWeakTopic({ id: "s1", examSlug: "waec-wassce", topicKeyword: "Mathematics" }, weakTopic())).toBe(
      false,
    );
  });

  it("matches when the keyword is null (any topic in the exam)", () => {
    expect(matchesWeakTopic({ id: "s1", examSlug: "jamb-utme", topicKeyword: null }, weakTopic())).toBe(true);
  });

  it("matches an exact keyword case-insensitively", () => {
    expect(matchesWeakTopic({ id: "s1", examSlug: "jamb-utme", topicKeyword: "mathematics" }, weakTopic())).toBe(
      true,
    );
  });

  it("matches a keyword that is a substring of the topic title", () => {
    expect(matchesWeakTopic({ id: "s1", examSlug: "jamb-utme", topicKeyword: "Math" }, weakTopic())).toBe(true);
  });

  it("matches a topic title that is a substring of a broader keyword", () => {
    expect(
      matchesWeakTopic(
        { id: "s1", examSlug: "jamb-utme", topicKeyword: "Mathematics and Statistics" },
        weakTopic({ title: "Mathematics" }),
      ),
    ).toBe(true);
  });

  it("does not match an unrelated keyword", () => {
    expect(matchesWeakTopic({ id: "s1", examSlug: "jamb-utme", topicKeyword: "Biology" }, weakTopic())).toBe(false);
  });
});

describe("rankMatches", () => {
  const tutor = (over: Partial<TutorRef> = {}): TutorRef => ({
    id: "tu1",
    displayName: "Ada Lovelace",
    headline: "Maths tutor",
    photoUrl: null,
    specializations: [{ id: "s1", examSlug: "jamb-utme", topicKeyword: "Mathematics" }],
    ...over,
  });

  it("returns a suggestion for a matching tutor", () => {
    const result = rankMatches([tutor()], [weakTopic()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ tutorId: "tu1", matchedTopic: { title: "Mathematics" } });
  });

  it("returns nothing when no tutor matches", () => {
    const result = rankMatches(
      [tutor({ specializations: [{ id: "s1", examSlug: "waec-wassce", topicKeyword: null }] })],
      [weakTopic()],
    );
    expect(result).toHaveLength(0);
  });

  it("includes each tutor at most once even if they match multiple weak topics", () => {
    const broad = tutor({ specializations: [{ id: "s1", examSlug: "jamb-utme", topicKeyword: null }] });
    const result = rankMatches(
      [broad],
      [weakTopic({ topicId: "t1", title: "Mathematics" }), weakTopic({ topicId: "t2", title: "Biology" })],
    );
    expect(result).toHaveLength(1);
  });

  it("respects the limit", () => {
    const tutors = [1, 2, 3, 4].map((n) => tutor({ id: `tu${n}` }));
    const result = rankMatches(tutors, [weakTopic()], 2);
    expect(result).toHaveLength(2);
  });

  it("follows weakTopics order, preferring matches on earlier (weaker) topics", () => {
    const mathTutor = tutor({ id: "math", specializations: [{ id: "s1", examSlug: "jamb-utme", topicKeyword: "Mathematics" }] });
    const bioTutor = tutor({ id: "bio", specializations: [{ id: "s2", examSlug: "jamb-utme", topicKeyword: "Biology" }] });
    const result = rankMatches(
      [bioTutor, mathTutor],
      [weakTopic({ title: "Mathematics" }), weakTopic({ title: "Biology" })],
      1,
    );
    expect(result[0].tutorId).toBe("math");
  });
});
