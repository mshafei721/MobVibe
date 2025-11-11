/**
 * Terminal Output Component Tests
 * Tests terminal rendering, ANSI parsing, and auto-scroll behavior
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TerminalOutput } from '../TerminalOutput';
import { TerminalLine } from '@/src/hooks/useTerminalOutput';

// Mock terminal lines
const mockLines: TerminalLine[] = [
  {
    id: '1',
    content: '\x1b[32m✓ Build completed successfully\x1b[0m',
    type: 'stdout',
    timestamp: new Date('2025-01-01T10:00:00'),
  },
  {
    id: '2',
    content: '\x1b[31m✗ Error: Module not found\x1b[0m',
    type: 'stderr',
    timestamp: new Date('2025-01-01T10:00:01'),
  },
  {
    id: '3',
    content: '\x1b[33m⚠ Warning: Deprecated API usage\x1b[0m',
    type: 'stdout',
    timestamp: new Date('2025-01-01T10:00:02'),
  },
];

describe('TerminalOutput', () => {
  it('renders terminal lines correctly', () => {
    const { getByText } = render(
      <TerminalOutput lines={mockLines} />
    );

    expect(getByText(/Build completed successfully/)).toBeTruthy();
    expect(getByText(/Error: Module not found/)).toBeTruthy();
    expect(getByText(/Warning: Deprecated API usage/)).toBeTruthy();
  });

  it('shows empty state when no lines', () => {
    const { getByText } = render(
      <TerminalOutput lines={[]} />
    );

    expect(getByText('No terminal output yet')).toBeTruthy();
    expect(getByText('Command output will appear here')).toBeTruthy();
  });

  it('shows execution indicator when executing', () => {
    const { getByText } = render(
      <TerminalOutput lines={mockLines} isExecuting={true} />
    );

    expect(getByText('Executing...')).toBeTruthy();
  });

  it('does not show execution indicator when idle', () => {
    const { queryByText } = render(
      <TerminalOutput lines={mockLines} isExecuting={false} />
    );

    expect(queryByText('Executing...')).toBeNull();
  });

  it('shows timestamps when enabled', () => {
    const { getByText } = render(
      <TerminalOutput lines={mockLines} showTimestamps={true} />
    );

    // Check for timestamp format (HH:MM:SS)
    expect(getByText(/10:00:00/)).toBeTruthy();
  });

  it('shows line numbers when enabled', () => {
    const { getByText } = render(
      <TerminalOutput lines={mockLines} showLineNumbers={true} />
    );

    // Check for line numbers
    expect(getByText(/1/)).toBeTruthy();
    expect(getByText(/2/)).toBeTruthy();
  });
});
