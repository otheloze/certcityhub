import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, H1, LoadingScreen, Muted, Screen } from "../../src/components/ui";
import { API_ORIGIN } from "../../src/lib/api-client";
import { fetchPublicTutors, PublicTutor } from "../../src/lib/tutor-api";

export default function TutorsScreen() {
  const router = useRouter();
  const [tutors, setTutors] = useState<PublicTutor[] | null>(null);

  useEffect(() => {
    fetchPublicTutors()
      .then(setTutors)
      .catch(() => setTutors([]));
  }, []);

  if (tutors === null) return <LoadingScreen label="Loading tutors…" />;

  return (
    <Screen>
      <H1>Find a tutor</H1>
      <Muted>
        Verified tutors, reviewed before they&rsquo;re listed. Reach out directly — booking and payment happen
        between you and the tutor, outside this platform.
      </Muted>
      {tutors.length === 0 ? (
        <Card>
          <Muted>No tutors are listed yet.</Muted>
        </Card>
      ) : (
        tutors.map((tutor) => (
          <Pressable key={tutor.id} onPress={() => router.push(`/tutors/${tutor.id}`)} style={styles.row}>
            {tutor.photoUrl ? (
              <Image source={{ uri: `${API_ORIGIN}${tutor.photoUrl}` }} style={styles.photo} />
            ) : (
              <View style={styles.initial}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{tutor.displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{tutor.displayName}</Text>
              {tutor.headline ? <Muted>{tutor.headline}</Muted> : null}
              <Muted>
                {tutor.specializations
                  .slice(0, 3)
                  .map((s) => (s.topicKeyword ? `${s.exam.title} — ${s.topicKeyword}` : s.exam.title))
                  .join(" · ")}
              </Muted>
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  photo: { width: 48, height: 48, borderRadius: 24 },
  initial: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  name: { color: colors.text, fontWeight: "700", fontSize: 15 },
});
