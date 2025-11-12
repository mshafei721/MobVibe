/**
 * ANSI Color Parser
 * Parses ANSI escape codes and returns structured data for rendering
 */

export interface TextSegment {
  text: string;
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dim?: boolean;
}

export interface ParsedLine {
  segments: TextSegment[];
}

/**
 * ANSI color codes mapping (Dracula theme colors)
 */
export const ANSI_COLORS: Record<number, string> = {
  30: '#000000', 31: '#ff5555', 32: '#50fa7b', 33: '#f1fa8c',
  34: '#bd93f9', 35: '#ff79c6', 36: '#8be9fd', 37: '#f8f8f2',
  40: '#000000', 41: '#ff5555', 42: '#50fa7b', 43: '#f1fa8c',
  44: '#bd93f9', 45: '#ff79c6', 46: '#8be9fd', 47: '#f8f8f2',
  90: '#6272a4', 91: '#ff6e6e', 92: '#69ff94', 93: '#ffffa5',
  94: '#d6acff', 95: '#ff92df', 96: '#a4ffff', 97: '#ffffff',
  100: '#6272a4', 101: '#ff6e6e', 102: '#69ff94', 103: '#ffffa5',
  104: '#d6acff', 105: '#ff92df', 106: '#a4ffff', 107: '#ffffff',
};

export const TERMINAL_COLORS = {
  success: '#50fa7b',
  error: '#ff5555',
  warning: '#f1fa8c',
  info: '#8be9fd',
  default: '#f8f8f2',
  dim: '#6272a4',
};

export function parseAnsi(line: string): ParsedLine {
  const segments: TextSegment[] = [];
  let currentColor: string | undefined;
  let currentBgColor: string | undefined;
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isDim = false;

  const ansiRegex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let match;

  while ((match = ansiRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      const text = line.substring(lastIndex, match.index);
      if (text.length > 0) {
        const segment: TextSegment = { text };
        if (currentColor) segment.color = currentColor;
        if (currentBgColor) segment.backgroundColor = currentBgColor;
        if (isBold) segment.bold = true;
        if (isItalic) segment.italic = true;
        if (isUnderline) segment.underline = true;
        if (isDim) segment.dim = true;
        segments.push(segment);
      }
    }

    const codes = match[1].split(';').map(Number);
    for (const code of codes) {
      if (isNaN(code)) continue;
      if (code === 0) {
        currentColor = undefined; currentBgColor = undefined;
        isBold = false; isItalic = false; isUnderline = false; isDim = false;
      } else if (code === 22) { isBold = false; isDim = false; }
      else if (code === 23) { isItalic = false; }
      else if (code === 24) { isUnderline = false; }
      else if (code === 39) { currentColor = undefined; }
      else if (code === 49) { currentBgColor = undefined; }
      else if (code === 1) { isBold = true; }
      else if (code === 2) { isDim = true; }
      else if (code === 3) { isItalic = true; }
      else if (code === 4) { isUnderline = true; }
      else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
        currentColor = ANSI_COLORS[code];
      } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
        currentBgColor = ANSI_COLORS[code];
      }
    }
    lastIndex = ansiRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    const text = line.substring(lastIndex);
    if (text.length > 0) {
      const segment: TextSegment = { text };
      if (currentColor) segment.color = currentColor;
      if (currentBgColor) segment.backgroundColor = currentBgColor;
      if (isBold) segment.bold = true;
      if (isItalic) segment.italic = true;
      if (isUnderline) segment.underline = true;
      if (isDim) segment.dim = true;
      segments.push(segment);
    }
  }

  if (segments.length === 0) {
    segments.push({ text: line });
  }

  return { segments };
}

export function stripAnsi(line: string): string {
  return line.replace(/\x1b\[[0-9;]*m/g, '');
}

export function isErrorLine(line: string): boolean {
  return /\b(error|exception|fail(ed|ure)?|✗|fatal|critical)\b/i.test(line);
}

export function isSuccessLine(line: string): boolean {
  return /\b(success|complete(d)?|✓|done|passed)\b/i.test(line);
}

export function isWarningLine(line: string): boolean {
  return /(\bwarn(ing)?\b|\bdeprecated\b|⚠|\bcaution\b)/i.test(line);
}

export function autoColorize(line: string): string {
  // Don't colorize already colored lines
  if (/\x1b\[/.test(line)) return line;

  // Check success first (before error) to avoid false matches
  if (isSuccessLine(line)) return `\x1b[32m${line}\x1b[0m`;
  if (isWarningLine(line)) return `\x1b[33m${line}\x1b[0m`;
  if (isErrorLine(line)) return `\x1b[31m${line}\x1b[0m`;

  return line;
}
