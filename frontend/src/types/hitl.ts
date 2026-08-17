export interface HitlInterruptPayload {
  interrupt_id: string;
  tool_name: string;
  action: string;
  description: string;
  args: Record<string, unknown>;
  thread_id: string;
}

export interface HitlResumeRequest {
  thread_id: string;
  decision: 'approve' | 'reject';
  modified_args?: Record<string, unknown>;
}
