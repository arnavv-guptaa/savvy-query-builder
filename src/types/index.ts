
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'url';
  size: number;
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'failed';
  chunks?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: {
    documentId: string;
    documentName: string;
    relevance: number;
  }[];
}

export interface ChatbotSettings {
  name: string;
  primaryColor: string;
  welcomeMessage: string;
  tone: 'professional' | 'friendly' | 'concise';
  maxTokens: number;
  includeSources: boolean;
}
