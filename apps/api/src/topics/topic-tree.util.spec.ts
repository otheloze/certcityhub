import { buildTree, FlatTopicNode } from "./topic-tree.util";

interface TestTopic extends FlatTopicNode {
  title: string;
  sortOrder: number;
}

describe("buildTree", () => {
  it("assembles a flat list into a nested tree by parentId", () => {
    const flat: TestTopic[] = [
      { id: "domain-1", parentId: null, title: "Domain 1", sortOrder: 0 },
      { id: "section-1-1", parentId: "domain-1", title: "Section 1.1", sortOrder: 0 },
      { id: "topic-1-1-1", parentId: "section-1-1", title: "Topic 1.1.1", sortOrder: 0 },
      { id: "subtopic-1-1-1-1", parentId: "topic-1-1-1", title: "Subtopic 1.1.1.1", sortOrder: 0 },
    ];

    const tree = buildTree(flat);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("domain-1");
    expect(tree[0].children[0].id).toBe("section-1-1");
    expect(tree[0].children[0].children[0].id).toBe("topic-1-1-1");
    // Four levels deep: domain -> section -> topic -> subtopic.
    expect(tree[0].children[0].children[0].children[0].id).toBe("subtopic-1-1-1-1");
  });

  it("orders siblings by sortOrder", () => {
    const flat: TestTopic[] = [
      { id: "b", parentId: null, title: "B", sortOrder: 1 },
      { id: "a", parentId: null, title: "A", sortOrder: 0 },
    ];

    const tree = buildTree(flat);

    expect(tree.map((node) => node.id)).toEqual(["a", "b"]);
  });

  it("treats a node with a dangling parentId as a root", () => {
    const flat: TestTopic[] = [
      { id: "orphan", parentId: "missing-parent", title: "Orphan", sortOrder: 0 },
    ];

    const tree = buildTree(flat);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("orphan");
  });
});
