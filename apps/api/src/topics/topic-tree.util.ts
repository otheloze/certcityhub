// Pure, DB-free tree assembly so it can be unit tested in isolation from Prisma.

export interface FlatTopicNode {
  id: string;
  parentId: string | null;
  [key: string]: unknown;
}

export type TreeTopicNode<T extends FlatTopicNode> = T & { children: TreeTopicNode<T>[] };

export function buildTree<T extends FlatTopicNode>(flat: T[]): TreeTopicNode<T>[] {
  const byId = new Map<string, TreeTopicNode<T>>();
  for (const node of flat) {
    byId.set(node.id, { ...node, children: [] });
  }

  const roots: TreeTopicNode<T>[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursively = (nodes: TreeTopicNode<T>[]) => {
    nodes.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const node of nodes) {
      sortRecursively(node.children);
    }
  };
  sortRecursively(roots);

  return roots;
}
