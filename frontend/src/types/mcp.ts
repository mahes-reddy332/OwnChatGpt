export type MCPTransportType = 'stdio' | 'sse' | 'streamable_http';

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: MCPTransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  status?: string;
  tools_count?: number;
  error?: string;
}

export interface MCPServerCreatePayload {
  id: string;
  name: string;
  transport: MCPTransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
}
