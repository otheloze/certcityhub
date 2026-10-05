import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "./ui";

export interface AccuracyRow {
  id: string;
  label: string;
  sub?: string;
  value: number;
  correct: number;
  total: number;
  action?: ReactNode;
}

function toneFor(value: number) {
  if (value >= 75) return colors.good;
  if (value >= 50) return colors.warn;
  return colors.danger;
}

export function AccuracyBars({ rows }: { rows: AccuracyRow[] }) {
  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => (
        <View key={row.id} style={styles.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.label}>{row.label}</Text>
            {row.sub ? <Text style={styles.sub}>{row.sub}</Text> : null}
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(100, row.value)}%`, backgroundColor: toneFor(row.value) }]} />
            </View>
            <Text style={styles.sub}>
              {row.correct}/{row.total} correct · {Math.round(row.value)}%
            </Text>
          </View>
          {row.action ? <View>{row.action}</View> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { color: colors.text, fontWeight: "600", fontSize: 14 },
  sub: { color: colors.muted, fontSize: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: "#1c2740", overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
});
