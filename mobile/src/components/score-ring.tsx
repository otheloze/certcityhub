import { StyleSheet, Text, View } from "react-native";

import { colors } from "./ui";

function toneFor(percentage: number) {
  if (percentage >= 75) return colors.good;
  if (percentage >= 50) return colors.warn;
  return colors.danger;
}

export function ScoreRing({ percentage, label }: { percentage: number; label?: string }) {
  const tone = toneFor(percentage);
  return (
    <View style={[styles.ring, { borderColor: tone }]}>
      <Text style={[styles.value, { color: tone }]}>{Math.round(percentage)}%</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 11, color: colors.muted },
});
