export interface LanguageInfo {
  language: string
  displayName: string
  icon: string
  highlightable: boolean
}

const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  js: {
    language: 'javascript',
    displayName: 'JavaScript',
    icon: 'logo-javascript',
    highlightable: true,
  },
  jsx: {
    language: 'jsx',
    displayName: 'React JSX',
    icon: 'logo-react',
    highlightable: true,
  },
  ts: {
    language: 'typescript',
    displayName: 'TypeScript',
    icon: 'logo-javascript',
    highlightable: true,
  },
  tsx: {
    language: 'tsx',
    displayName: 'React TSX',
    icon: 'logo-react',
    highlightable: true,
  },
  css: {
    language: 'css',
    displayName: 'CSS',
    icon: 'color-palette',
    highlightable: true,
  },
  scss: {
    language: 'scss',
    displayName: 'SCSS',
    icon: 'color-palette',
    highlightable: true,
  },
  json: {
    language: 'json',
    displayName: 'JSON',
    icon: 'code-slash',
    highlightable: true,
  },
  html: {
    language: 'html',
    displayName: 'HTML',
    icon: 'logo-html5',
    highlightable: true,
  },
  md: {
    language: 'markdown',
    displayName: 'Markdown',
    icon: 'document-text',
    highlightable: true,
  },
  py: {
    language: 'python',
    displayName: 'Python',
    icon: 'logo-python',
    highlightable: true,
  },
  java: {
    language: 'java',
    displayName: 'Java',
    icon: 'cafe',
    highlightable: true,
  },
  go: {
    language: 'go',
    displayName: 'Go',
    icon: 'code-slash',
    highlightable: true,
  },
  rs: {
    language: 'rust',
    displayName: 'Rust',
    icon: 'construct',
    highlightable: true,
  },
  rb: {
    language: 'ruby',
    displayName: 'Ruby',
    icon: 'diamond',
    highlightable: true,
  },
  php: {
    language: 'php',
    displayName: 'PHP',
    icon: 'code-slash',
    highlightable: true,
  },
  c: {
    language: 'c',
    displayName: 'C',
    icon: 'code-slash',
    highlightable: true,
  },
  cpp: {
    language: 'cpp',
    displayName: 'C++',
    icon: 'code-slash',
    highlightable: true,
  },
  cs: {
    language: 'csharp',
    displayName: 'C#',
    icon: 'code-slash',
    highlightable: true,
  },
  swift: {
    language: 'swift',
    displayName: 'Swift',
    icon: 'code-slash',
    highlightable: true,
  },
  kt: {
    language: 'kotlin',
    displayName: 'Kotlin',
    icon: 'code-slash',
    highlightable: true,
  },
  yaml: {
    language: 'yaml',
    displayName: 'YAML',
    icon: 'document-text',
    highlightable: true,
  },
  yml: {
    language: 'yaml',
    displayName: 'YAML',
    icon: 'document-text',
    highlightable: true,
  },
  xml: {
    language: 'xml',
    displayName: 'XML',
    icon: 'code-slash',
    highlightable: true,
  },
  sql: {
    language: 'sql',
    displayName: 'SQL',
    icon: 'server',
    highlightable: true,
  },
  sh: {
    language: 'bash',
    displayName: 'Shell Script',
    icon: 'terminal',
    highlightable: true,
  },
  bash: {
    language: 'bash',
    displayName: 'Bash',
    icon: 'terminal',
    highlightable: true,
  },
  dockerfile: {
    language: 'dockerfile',
    displayName: 'Dockerfile',
    icon: 'cube',
    highlightable: true,
  },
  txt: {
    language: 'text',
    displayName: 'Text',
    icon: 'document',
    highlightable: false,
  },
}

export function detectLanguage(filename: string): LanguageInfo {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (!ext) {
    return {
      language: 'text',
      displayName: 'Text',
      icon: 'document',
      highlightable: false,
    }
  }

  const lowercaseFilename = filename.toLowerCase()
  if (lowercaseFilename === 'dockerfile' || lowercaseFilename.startsWith('dockerfile.')) {
    return LANGUAGE_MAP.dockerfile
  }

  return (
    LANGUAGE_MAP[ext] || {
      language: 'text',
      displayName: 'Text',
      icon: 'document',
      highlightable: false,
    }
  )
}

export function getLanguageIcon(filename: string): string {
  return detectLanguage(filename).icon
}

export function getLanguageName(filename: string): string {
  return detectLanguage(filename).displayName
}

export function isHighlightable(filename: string): boolean {
  return detectLanguage(filename).highlightable
}

export function getSupportedLanguages(): string[] {
  return Array.from(new Set(Object.values(LANGUAGE_MAP).map((info) => info.language)))
}
