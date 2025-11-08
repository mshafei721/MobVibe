import Anthropic from '@anthropic-ai/sdk'

export const agentTools: Anthropic.Tool[] = [
  {
    name: 'bash',
    description: 'Execute bash command in sandbox environment. Use this to run shell commands, npm scripts, expo commands, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Bash command to execute (e.g., "npm install", "expo start")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read file contents from the workspace. Use this to inspect code, configuration files, etc.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to workspace (e.g., "src/App.tsx")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or update file contents in the workspace. Creates parent directories if needed.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to workspace',
        },
        content: {
          type: 'string',
          description: 'File content to write',
        },
      },
      required: ['path', 'content'],
    },
  },
]
