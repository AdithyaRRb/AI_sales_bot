export interface Message {
  id: string;
  message_type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Session {
  session_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
}

export interface UserInfo {
  cognitoId: string;
  name: string;
  userName: string;
  userEmail: string;
  role: string;
}

export interface ApiResponse {
  response: string;
  session_id: string;
  file_summary?: FileSummary;
}

export interface FileSummary {
  user_name: string;
  input_summary: string;
  client_name: string;
  client_region: string;
  vertical: string;
  feedback: string;
  project_status: string;
  timestamp: string;
}

export interface FileSummaryRecord {
  user_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  summary: FileSummary;
  created_at: string;
}
