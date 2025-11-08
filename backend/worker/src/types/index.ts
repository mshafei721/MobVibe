export interface Job {
  job_id: string
  session_id: string
  prompt: string
  priority?: number
}

export interface QueueStats {
  pending_count: number
  processing_count: number
  completed_count: number
  failed_count: number
  oldest_pending_age: string | null
}

export interface RealtimeJobPayload {
  job_id: string
  session_id: string
  priority: number
  created_at: string
}

export interface RealtimeStatusPayload {
  job_id: string
  session_id: string
  old_status: string
  new_status: string
  updated_at: string
}

export interface SandboxConfig {
  sessionId: string
  image: string
  memoryMb: number
  cpus: number
  region: string
  env?: Record<string, string>
}

export interface Sandbox {
  id: string
  name: string
  state: 'created' | 'started' | 'stopped' | 'destroyed'
  region: string
  privateIp?: string
  createdAt: Date
}

export interface ActiveSandbox {
  sandbox: Sandbox
  createdAt: Date
  sessionId: string
}

export interface ExecResult {
  exitCode: number
  stdout: string
  stderr: string
}
