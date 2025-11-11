/**
 * File Type Icons
 * Maps file extensions to emoji icons for visual representation
 */

export const FILE_ICONS: Record<string, string> = {
  // TypeScript/JavaScript
  tsx: '⚛️',
  ts: '📘',
  jsx: '⚛️',
  js: '📜',
  mjs: '📜',
  cjs: '📜',

  // Styles
  css: '🎨',
  scss: '🎨',
  sass: '🎨',
  less: '🎨',

  // Config
  json: '⚙️',
  yaml: '⚙️',
  yml: '⚙️',
  toml: '⚙️',
  ini: '⚙️',
  env: '🔐',

  // Markup
  html: '🌐',
  htm: '🌐',
  md: '📝',
  mdx: '📝',
  xml: '📄',

  // Assets
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
  gif: '🖼️',
  svg: '🎨',
  ico: '🖼️',
  webp: '🖼️',

  // Data
  csv: '📊',
  sql: '🗃️',
  db: '🗃️',
  sqlite: '🗃️',

  // Documents
  pdf: '📕',
  doc: '📄',
  docx: '📄',
  txt: '📄',

  // Code
  py: '🐍',
  java: '☕',
  c: '©️',
  cpp: '©️',
  h: '©️',
  hpp: '©️',
  rs: '🦀',
  go: '🐹',
  rb: '💎',
  php: '🐘',
  swift: '🦅',
  kt: '🎯',
  sh: '🐚',
  bash: '🐚',
  ps1: '💻',

  // Special
  gitignore: '🚫',
  dockerfile: '🐳',
  lock: '🔒',

  // Default
  default: '📄',
};

/**
 * Get the appropriate icon for a file based on its name
 * @param fileName - The name of the file (e.g., "index.tsx", ".gitignore")
 * @returns The emoji icon representing the file type
 */
export function getFileIcon(fileName: string): string {
  // Handle special files
  const lowerName = fileName.toLowerCase();
  if (lowerName === '.gitignore') return FILE_ICONS.gitignore;
  if (lowerName === 'dockerfile') return FILE_ICONS.dockerfile;
  if (lowerName.endsWith('.lock')) return FILE_ICONS.lock;
  if (lowerName.endsWith('.env') || lowerName.startsWith('.env')) return FILE_ICONS.env;

  // Get extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return FILE_ICONS.default;

  return FILE_ICONS[ext] || FILE_ICONS.default;
}

/**
 * Get the folder icon
 * @param isOpen - Whether the folder is expanded
 * @returns The folder emoji
 */
export function getFolderIcon(isOpen: boolean): string {
  return isOpen ? '📂' : '📁';
}
