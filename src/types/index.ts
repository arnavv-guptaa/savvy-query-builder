
export interface Document {
  id: string;
  chatbot_id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'url';
  size: number;
  upload_path?: string;
  url?: string;
  status: 'processing' | 'completed' | 'failed';
  chunks?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Chatbot {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  welcome_message: string;
  primary_color: string;
  tone: 'professional' | 'friendly' | 'concise';
  max_tokens: number;
  include_sources: boolean;
  share_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  chatbot_id: string;
  session_id: string;
  text: string;
  sender: 'user' | 'bot';
  sources?: {
    documentId: string;
    documentName: string;
    relevance: number;
  }[];
  created_at: Date;
}

export interface ChatbotSettings extends Omit<Chatbot, 'id' | 'user_id' | 'share_id' | 'created_at' | 'updated_at'> {}
