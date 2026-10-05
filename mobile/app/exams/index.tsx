import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, H1, LoadingScreen, Muted, Screen } from "../../src/components/ui";
import { CatalogueExam, fetchCatalogue } from "../../src/lib/api-client";

export default function ExamsScreen() {
  const router = useRouter();
  const [exams, setExams] = useState<CatalogueExam[] | null>(null);

  useEffect(() => {
    fetchCatalogue()
      .then(setExams)
      .catch(() => setExams([]));
  }, []);

  if (exams === null) return <LoadingScreen label="Loading exams…" />;

  return (
    <Screen>
      <H1>Find your exam</H1>
      <Muted>Practice is free for every exam.</Muted>
      {exams.length === 0 ? (
        <Card>
          <Muted>No exams are available yet. Check that the API is running.</Muted>
        </Card>
      ) : (
        exams.map((e) => (
          <Pressable key={e.id} onPress={() => router.push(`/exams/${e.slug}`)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{e.title}</Text>
              <Muted>
                {e.provider ? `${e.provider} · ` : ""}
                {e.category}
              </Muted>
              {e.version ? (
                <Muted>
                  {e.version.questionCount} questions · {e.version.topicCount} topics · {e.version.durationMinutes} min
                </Muted>
              ) : (
                <Muted>Not published yet</Muted>
              )}
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 15, marginBottom: 2 },
});
