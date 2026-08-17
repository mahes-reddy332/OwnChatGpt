export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface UserPreferences {
  response_style: 'concise' | 'balanced' | 'detailed';
  custom_instructions: string;
  theme: 'dark' | 'light' | 'system';
  show_citations: boolean;
  show_tool_activity: boolean;
}

export interface SessionInfo {
  id: string;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  is_current: boolean;
  user_agent?: string | null;
  ip_address?: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'expired';
