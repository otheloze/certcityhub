import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";

import { Card, colors, H1, H2, LoadingScreen, Muted, PrimaryButton, Screen } from "../../src/components/ui";
import { API_ORIGIN } from "../../src/lib/api-client";
import { fetchPublicTutor, PublicTutor } from "../../src/lib/tutor-api";

export default function TutorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tutor, setTutor] = useState<PublicTutor | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPublicTutor(id)
      .then(setTutor)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <Screen>
        <Muted>This tutor profile isn't available.</Muted>
      </Screen>
    );
  }
  if (!tutor) return <LoadingScreen />;

  return (
    <Screen>
      <View style={styles.headRow}>
        {tutor.photoUrl ? (
          <Image source={{ uri: `${API_ORIGIN}${tutor.photoUrl}` }} style={styles.photo} />
        ) : (
          <View style={styles.initial}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 22 }}>{tutor.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <H1>{tutor.displayName}</H1>
          {tutor.headline ? <Muted>{tutor.headline}</Muted> : null}
        </View>
      </View>

      {tutor.bio ? (
        <Card>
          <Text style={{ color: colors.text }}>{tutor.bio}</Text>
        </Card>
      ) : null}

      <Card>
        <H2>Areas of specialization</H2>
        {tutor.specializations.map((s) => (
          <Muted key={s.id}>
            • {s.exam.title}
            {s.topicKeyword ? ` — ${s.topicKeyword}` : ""}
          </Muted>
        ))}
      </Card>

      {tutor.resumeUrl ? (
        <Card>
          <H2>Resume</H2>
          <PrimaryButton title="View resume" onPress={() => Linking.openURL(`${API_ORIGIN}${tutor.resumeUrl}`)} />
        </Card>
      ) : null}

      <Muted>
        This platform does not handle booking, messaging or payment for tutoring — contact this tutor directly to
        arrange sessions.
      </Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  photo: { width: 72, height: 72, borderRadius: 36 },
  initial: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
