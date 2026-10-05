import { Text, View } from "react-native";

import { colors } from "./ui";

interface Block {
  type: string;
  text?: string;
}

const PARAGRAPH_BREAK = /\n\n+/;

// Renders a question stem. A "passage" block is a reading text or transcript
// shown in its own pane above the question; "text" blocks are the question itself.
export function StemBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((block, i) => {
        if (!block.text) return null;
        const paragraphs = block.text.split(PARAGRAPH_BREAK);
        if (block.type === "passage") {
          return (
            <View key={i} style={{ backgroundColor: "#0e1626", borderRadius: 10, padding: 12, gap: 6 }}>
              {paragraphs.map((para, j) => (
                <Text key={j} style={{ color: colors.muted, lineHeight: 20 }}>
                  {para}
                </Text>
              ))}
            </View>
          );
        }
        if (block.type === "text") {
          return (
            <View key={i} style={{ gap: 6 }}>
              {paragraphs.map((para, j) => (
                <Text key={j} style={{ color: colors.text, fontSize: 16, lineHeight: 22 }}>
                  {para}
                </Text>
              ))}
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}
