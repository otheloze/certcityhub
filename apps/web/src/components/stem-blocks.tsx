import { Fragment } from "react";

interface Block {
  type: string;
  text?: string;
}

const PARAGRAPH_BREAK = /\n\n+/;

// Renders a question stem. A "passage" block is a reading text or transcript
// shown in its own pane above the question; "text" blocks are the question itself.
export function StemBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (!block.text) return null;
        const paragraphs = block.text.split(PARAGRAPH_BREAK);
        if (block.type === "passage") {
          return (
            <div key={i} className="q-passage" role="region" aria-label="Reading passage">
              {paragraphs.map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </div>
          );
        }
        if (block.type === "text") {
          return (
            <Fragment key={i}>
              {paragraphs.map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </Fragment>
          );
        }
        return null;
      })}
    </>
  );
}
