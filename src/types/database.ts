
export type QueryDatabase = {
  profiles: {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  chatbots: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    welcome_message: string;
    primary_color: string;
    tone: 'professional' | 'friendly' | 'concise';
    max_tokens: number;
    include_sources: boolean;
    share_id: string;
    created_at: string;
    updated_at: string;
  };
  documents: {
    id: string;
    chatbot_id: string;
    name: string;
    type: 'pdf' | 'docx' | 'txt' | 'url';
    size: number;
    upload_path: string | null;
    url: string | null;
    status: 'processing' | 'completed' | 'failed';
    chunks: number | null;
    created_at: string;
    updated_at: string;
  };
  chat_messages: {
    id: string;
    chatbot_id: string;
    session_id: string;
    text: string;
    sender: 'user' | 'bot';
    sources: {
      documentId: string;
      documentName: string;
      relevance: number;
    }[] | null;
    created_at: string;
  };
}

export type Tables<T extends keyof QueryDatabase> = QueryDatabase[T];
