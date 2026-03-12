import React from "react";
import type { GitChange, GitChangeStatus } from "#/api/open-hands.types";

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  status?: GitChangeStatus;
  children: FileTreeNode[];
  depth: number;
  fileCount: number;
}

export interface FlatTreeNode {
  node: FileTreeNode;
  isExpanded: boolean;
  depth: number;
}

const BUILD_ARTIFACT_PATTERNS = [
  /^\.next\//,
  /^node_modules\//,
  /^dist\//,
  /^build\//,
  /^\.cache\//,
  /^__pycache__\//,
  /^\.turbo\//,
  /^coverage\//,
];

function isBuildArtifact(path: string): boolean {
  return BUILD_ARTIFACT_PATTERNS.some((pattern) => pattern.test(path));
}

function buildTree(changes: GitChange[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "",
    path: "",
    isDirectory: true,
    children: [],
    depth: 0,
    fileCount: 0,
  };

  for (const change of changes) {
    const parts = change.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: currentPath,
          isDirectory: !isFile,
          status: isFile ? change.status : undefined,
          children: [],
          depth: i + 1,
          fileCount: 0,
        };
        current.children.push(child);
      }

      if (isFile) {
        child.status = change.status;
      }

      current = child;
    }
  }

  const countFiles = (node: FileTreeNode): number => {
    if (!node.isDirectory) return 1;
    let count = 0;
    for (const child of node.children) {
      count += countFiles(child);
    }
    node.fileCount = count;
    return count;
  };
  countFiles(root);

  const sortChildren = (node: FileTreeNode) => {
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of node.children) {
      if (child.isDirectory) sortChildren(child);
    }
  };
  sortChildren(root);

  return root;
}

function flattenTree(
  node: FileTreeNode,
  expandedPaths: Set<string>,
  depth: number = 0,
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  for (const child of node.children) {
    const isExpanded = expandedPaths.has(child.path);
    result.push({ node: child, isExpanded, depth });

    if (child.isDirectory && isExpanded) {
      result.push(...flattenTree(child, expandedPaths, depth + 1));
    }
  }

  return result;
}

export function useFileTree(changes: GitChange[], searchQuery: string) {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(
    new Set(),
  );
  const [showArtifacts, setShowArtifacts] = React.useState(false);

  const { filteredChanges, artifactCount } = React.useMemo(() => {
    let artifactN = 0;
    const filtered: GitChange[] = [];

    for (const change of changes) {
      if (isBuildArtifact(change.path)) {
        artifactN++;
        if (showArtifacts) filtered.push(change);
      } else {
        filtered.push(change);
      }
    }

    return { filteredChanges: filtered, artifactCount: artifactN };
  }, [changes, showArtifacts]);

  const searchFiltered = React.useMemo(() => {
    if (!searchQuery.trim()) return filteredChanges;
    const q = searchQuery.toLowerCase();
    return filteredChanges.filter((c) => c.path.toLowerCase().includes(q));
  }, [filteredChanges, searchQuery]);

  const tree = React.useMemo(
    () => buildTree(searchFiltered),
    [searchFiltered],
  );

  const flatNodes = React.useMemo(
    () => flattenTree(tree, expandedPaths),
    [tree, expandedPaths],
  );

  const toggleExpanded = React.useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    const allDirs = new Set<string>();
    const collect = (node: FileTreeNode) => {
      if (node.isDirectory && node.path) allDirs.add(node.path);
      for (const child of node.children) collect(child);
    };
    collect(tree);
    setExpandedPaths(allDirs);
  }, [tree]);

  const collapseAll = React.useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const stats = React.useMemo(() => {
    let added = 0;
    let deleted = 0;
    let modified = 0;
    for (const c of searchFiltered) {
      if (c.status === "A" || c.status === "U") added++;
      else if (c.status === "D") deleted++;
      else if (c.status === "M") modified++;
    }
    return { total: searchFiltered.length, added, deleted, modified };
  }, [searchFiltered]);

  return {
    flatNodes,
    expandedPaths,
    toggleExpanded,
    expandAll,
    collapseAll,
    showArtifacts,
    setShowArtifacts,
    artifactCount,
    stats,
  };
}
