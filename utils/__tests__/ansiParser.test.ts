/**
 * ANSI Parser Tests
 * Tests ANSI escape code parsing and colorization
 */

import {
  parseAnsi,
  stripAnsi,
  isErrorLine,
  isSuccessLine,
  isWarningLine,
  autoColorize,
  ANSI_COLORS,
} from '../ansiParser';

describe('parseAnsi', () => {
  it('parses simple text without ANSI codes', () => {
    const result = parseAnsi('Hello World');
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].text).toBe('Hello World');
    expect(result.segments[0].color).toBeUndefined();
  });

  it('parses green text (success)', () => {
    const result = parseAnsi('\x1b[32mSuccess\x1b[0m');
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].text).toBe('Success');
    expect(result.segments[0].color).toBe(ANSI_COLORS[32]);
  });

  it('parses red text (error)', () => {
    const result = parseAnsi('\x1b[31mError\x1b[0m');
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].text).toBe('Error');
    expect(result.segments[0].color).toBe(ANSI_COLORS[31]);
  });

  it('parses multiple colored segments', () => {
    const result = parseAnsi('\x1b[32mSuccess\x1b[0m and \x1b[31mError\x1b[0m');
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].text).toBe('Success');
    expect(result.segments[0].color).toBe(ANSI_COLORS[32]);
    expect(result.segments[1].text).toBe(' and ');
    expect(result.segments[2].text).toBe('Error');
    expect(result.segments[2].color).toBe(ANSI_COLORS[31]);
  });

  it('parses bold text', () => {
    const result = parseAnsi('\x1b[1mBold\x1b[0m');
    expect(result.segments[0].text).toBe('Bold');
    expect(result.segments[0].bold).toBe(true);
  });

  it('parses italic text', () => {
    const result = parseAnsi('\x1b[3mItalic\x1b[0m');
    expect(result.segments[0].text).toBe('Italic');
    expect(result.segments[0].italic).toBe(true);
  });

  it('parses underlined text', () => {
    const result = parseAnsi('\x1b[4mUnderline\x1b[0m');
    expect(result.segments[0].text).toBe('Underline');
    expect(result.segments[0].underline).toBe(true);
  });

  it('parses dim text', () => {
    const result = parseAnsi('\x1b[2mDim\x1b[0m');
    expect(result.segments[0].text).toBe('Dim');
    expect(result.segments[0].dim).toBe(true);
  });

  it('handles reset codes', () => {
    const result = parseAnsi('\x1b[32m\x1b[1mGreen Bold\x1b[0m Normal');
    expect(result.segments[0].color).toBe(ANSI_COLORS[32]);
    expect(result.segments[0].bold).toBe(true);
    expect(result.segments[1].color).toBeUndefined();
    expect(result.segments[1].bold).toBeUndefined();
  });
});

describe('stripAnsi', () => {
  it('removes all ANSI codes', () => {
    expect(stripAnsi('\x1b[32mSuccess\x1b[0m')).toBe('Success');
    expect(stripAnsi('\x1b[31m\x1b[1mBold Red\x1b[0m')).toBe('Bold Red');
  });

  it('handles text without ANSI codes', () => {
    expect(stripAnsi('Plain text')).toBe('Plain text');
  });
});

describe('isErrorLine', () => {
  it('detects error patterns', () => {
    expect(isErrorLine('Error: Something failed')).toBe(true);
    expect(isErrorLine('Exception occurred')).toBe(true);
    expect(isErrorLine('Test failed')).toBe(true);
    expect(isErrorLine('✗ Build failed')).toBe(true);
  });

  it('does not detect non-errors', () => {
    expect(isErrorLine('Success: Build completed')).toBe(false);
    expect(isErrorLine('Warning: Deprecated')).toBe(false);
  });
});

describe('isSuccessLine', () => {
  it('detects success patterns', () => {
    expect(isSuccessLine('Success: Operation completed')).toBe(true);
    expect(isSuccessLine('✓ Tests passed')).toBe(true);
    expect(isSuccessLine('Build completed')).toBe(true);
    expect(isSuccessLine('Done in 2.3s')).toBe(true);
  });

  it('does not detect non-success', () => {
    expect(isSuccessLine('Error: Failed')).toBe(false);
    expect(isSuccessLine('Warning: Check this')).toBe(false);
  });
});

describe('isWarningLine', () => {
  it('detects warning patterns', () => {
    expect(isWarningLine('Warning: Deprecated API')).toBe(true);
    expect(isWarningLine('⚠ Be careful')).toBe(true);
    expect(isWarningLine('Caution: High memory usage')).toBe(true);
  });

  it('does not detect non-warnings', () => {
    expect(isWarningLine('Success: Completed')).toBe(false);
    expect(isWarningLine('Error: Failed')).toBe(false);
  });
});

describe('autoColorize', () => {
  it('colorizes error lines', () => {
    const result = autoColorize('Error: Something failed');
    expect(result).toContain('\x1b[31m');
  });

  it('colorizes success lines', () => {
    const result = autoColorize('Success: Build completed');
    expect(result).toContain('\x1b[32m');
  });

  it('colorizes warning lines', () => {
    const result = autoColorize('Warning: Deprecated');
    expect(result).toContain('\x1b[33m');
  });

  it('does not colorize already colored lines', () => {
    const colored = '\x1b[32mSuccess\x1b[0m';
    expect(autoColorize(colored)).toBe(colored);
  });

  it('does not colorize normal lines', () => {
    const normal = 'Normal output';
    expect(autoColorize(normal)).toBe(normal);
  });
});
