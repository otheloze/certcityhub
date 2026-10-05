// Adds `questionCount` to every node of a topic tree: the number of DISTINCT
// questions mapped to the node or anything beneath it. A question tagged with
// two sibling topics still counts once in their shared parent.

export interface CountableNode {
  id: string;
  children: CountableNode[];
}

export interface QuestionTopicPair {
  questionId: string;
  topicId: string;
}

export type WithQuestionCount<T extends CountableNode> = Omit<T, "children"> & {
  questionCount: number;
  children: WithQuestionCount<T>[];
};

export function annotateQuestionCounts<T extends CountableNode>(
  tree: T[],
  pairs: QuestionTopicPair[],
): WithQuestionCount<T>[] {
  const questionsByTopic = new Map<string, Set<string>>();
  for (const { questionId, topicId } of pairs) {
    const set = questionsByTopic.get(topicId) ?? new Set<string>();
    set.add(questionId);
    questionsByTopic.set(topicId, set);
  }

  const visit = (node: T): { out: WithQuestionCount<T>; questions: Set<string> } => {
    const questions = new Set<string>(questionsByTopic.get(node.id) ?? []);
    const children = (node.children as T[]).map((child) => {
      const result = visit(child);
      result.questions.forEach((q) => questions.add(q));
      return result.out;
    });
    return {
      out: { ...node, children, questionCount: questions.size } as unknown as WithQuestionCount<T>,
      questions,
    };
  };

  return tree.map((root) => visit(root).out);
}
