// Question stems, option content, and explanations are all built from an
// extensible array of content blocks rather than a plain string column, so
// new block types (image, audio, ...) can be added later without a migration.

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ImageBlock {
  type: "image";
  url: string;
  alt?: string;
}

export type ContentBlock = TextBlock | ImageBlock;

export interface ContentBlockDocument {
  blocks: ContentBlock[];
}
