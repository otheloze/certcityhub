// Practice sessions can target a topic plus everything nested beneath it.
// Topics form an unlimited-depth tree, so collect descendants iteratively.

export interface TopicRef {
  id: string;
  parentId: string | null;
}

export function collectSubtreeIds(topics: TopicRef[], rootId: string): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const topic of topics) {
    if (!topic.parentId) continue;
    const siblings = childrenByParent.get(topic.parentId) ?? [];
    siblings.push(topic.id);
    childrenByParent.set(topic.parentId, siblings);
  }

  const result: string[] = [];
  const seen = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    stack.push(...(childrenByParent.get(id) ?? []));
  }
  return result;
}
