export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Pad {
  id: string;
  title: string;
  language: ProgrammingLanguage;
  code: string;
  is_public: boolean;
  share_token?: string;
  user_id: string;
  last_executed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PadSession {
  id: string;
  pad_id: string;
  session_id: string;
  username: string;
  is_active: boolean;
  cursor_position?: CursorPosition;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export type ProgrammingLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'cpp';

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  execution_time: number;
}

export interface SocketUser {
  id: string;
  username: string;
  padId: string;
  cursorPosition?: CursorPosition;
}