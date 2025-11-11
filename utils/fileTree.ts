/**
 * File Tree Utilities
 * Convert flat file paths to hierarchical tree structure
 */

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  content?: string;
}

/**
 * Build a hierarchical tree from flat file paths
 * @param files - Record of file paths to content
 * @returns Root tree node with nested children
 *
 * @example
 * ```ts
 * const files = {
 *   'app/index.tsx': 'content',
 *   'app/layout.tsx': 'content',
 *   'components/Button.tsx': 'content'
 * };
 * const tree = buildFileTree(files);
 * ```
 */
export function buildFileTree(files: Record<string, string>): TreeNode {
  const root: TreeNode = {
    name: 'root',
    path: '',
    type: 'folder',
    children: [],
  };

  // Sort paths to ensure consistent ordering
  const sortedPaths = Object.keys(files).sort();

  sortedPaths.forEach((filePath) => {
    const parts = filePath.split('/');
    let current = root;

    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1;
      const currentPath = parts.slice(0, idx + 1).join('/');

      // Find existing node
      let child = current.children?.find((c) => c.name === part);

      if (!child) {
        // Create new node
        child = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? files[filePath] : undefined,
        };
        current.children?.push(child);
      }

      // Move to next level
      if (!isFile) {
        current = child;
      }
    });
  });

  // Sort children: folders first, then files, both alphabetically
  sortTree(root);

  return root;
}

/**
 * Sort tree nodes recursively: folders first, then files, alphabetically
 */
function sortTree(node: TreeNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    // Folders before files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    // Alphabetically within same type
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children
  node.children.forEach(sortTree);
}

/**
 * Flatten tree back to file paths
 * @param node - Tree node to flatten
 * @returns Array of file paths
 */
export function flattenTree(node: TreeNode): string[] {
  if (node.type === 'file') {
    return [node.path];
  }

  if (!node.children) return [];

  return node.children.flatMap((child) => flattenTree(child));
}

/**
 * Get all parent paths for a given file path
 * @param filePath - The file path
 * @returns Array of parent folder paths
 *
 * @example
 * ```ts
 * getParentPaths('app/components/Button.tsx')
 * // Returns: ['app', 'app/components']
 * ```
 */
export function getParentPaths(filePath: string): string[] {
  const parts = filePath.split('/');
  const parents: string[] = [];

  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('/'));
  }

  return parents;
}

/**
 * Count files in a tree node
 * @param node - Tree node
 * @returns Total number of files (not folders)
 */
export function countFiles(node: TreeNode): number {
  if (node.type === 'file') return 1;
  if (!node.children) return 0;

  return node.children.reduce((count, child) => count + countFiles(child), 0);
}

/**
 * Find a node by path in the tree
 * @param root - Root tree node
 * @param path - Path to find
 * @returns The node if found, undefined otherwise
 */
export function findNodeByPath(
  root: TreeNode,
  path: string
): TreeNode | undefined {
  if (root.path === path) return root;
  if (!root.children) return undefined;

  for (const child of root.children) {
    const found = findNodeByPath(child, path);
    if (found) return found;
  }

  return undefined;
}

/**
 * Search for files matching a query (fuzzy search)
 * @param files - Record of file paths to content
 * @param query - Search query
 * @returns Matching file paths sorted by relevance
 */
export function searchFiles(
  files: Record<string, string>,
  query: string
): string[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  const results: { path: string; score: number }[] = [];

  Object.keys(files).forEach((filePath) => {
    const fileName = filePath.split('/').pop() || '';
    const lowerPath = filePath.toLowerCase();
    const lowerName = fileName.toLowerCase();

    let score = 0;

    // Exact file name match
    if (lowerName === lowerQuery) {
      score = 100;
    }
    // File name starts with query
    else if (lowerName.startsWith(lowerQuery)) {
      score = 80;
    }
    // File name contains query
    else if (lowerName.includes(lowerQuery)) {
      score = 60;
    }
    // Full path contains query
    else if (lowerPath.includes(lowerQuery)) {
      score = 40;
    }
    // Fuzzy match (all characters in order)
    else if (fuzzyMatch(lowerName, lowerQuery)) {
      score = 20;
    }

    if (score > 0) {
      results.push({ path: filePath, score });
    }
  });

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.path);
}

/**
 * Fuzzy match: check if all characters of query appear in order in target
 */
function fuzzyMatch(target: string, query: string): boolean {
  let queryIdx = 0;
  let targetIdx = 0;

  while (queryIdx < query.length && targetIdx < target.length) {
    if (query[queryIdx] === target[targetIdx]) {
      queryIdx++;
    }
    targetIdx++;
  }

  return queryIdx === query.length;
}

/**
 * Get language/syntax from file extension
 * @param fileName - The file name
 * @returns Language identifier for syntax highlighting
 */
export function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    rs: 'rust',
    go: 'go',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sh: 'bash',
    bash: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql',
  };

  return languageMap[ext || ''] || 'plaintext';
}
