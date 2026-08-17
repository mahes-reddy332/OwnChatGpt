export type ToolExecutionStatus = 'running' | 'completed' | 'error';
export type ToolType = 'builtin' | 'mcp' | 'rag';

export interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: ToolExecutionStatus;
  tool_type?: ToolType;
  execution_time_ms?: number;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
  is_mcp?: boolean;
  tool_type?: ToolType;
}
