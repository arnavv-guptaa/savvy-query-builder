
import { Chatbot, ChatMessage, Document } from "@/types";

// Sample documents
export const sampleDocuments: Document[] = [
  {
    id: "1",
    chatbot_id: "1",
    name: "Product Manual.pdf",
    type: "pdf",
    size: 2500000,
    status: "completed",
    chunks: 15,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "2",
    chatbot_id: "1",
    name: "Support FAQ.docx",
    type: "docx",
    size: 1200000,
    status: "completed",
    chunks: 8,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "3",
    chatbot_id: "1",
    name: "API Documentation.txt",
    type: "txt",
    size: 500000,
    status: "completed",
    chunks: 5,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: "4",
    chatbot_id: "1",
    name: "Installation Guide.pdf",
    type: "pdf",
    size: 1800000,
    status: "processing",
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Sample chat messages
export const sampleMessages: ChatMessage[] = [
  {
    id: "1",
    chatbot_id: "1",
    session_id: "session-123",
    text: "Hello! How can I help you today?",
    sender: "bot",
    created_at: new Date()
  },
  {
    id: "2",
    chatbot_id: "1",
    session_id: "session-123",
    text: "I'm looking for information about your product pricing.",
    sender: "user",
    created_at: new Date()
  },
  {
    id: "3",
    chatbot_id: "1",
    session_id: "session-123",
    text: "Our product pricing starts at $29/month for the basic plan. The premium plan is $59/month and includes additional features such as advanced analytics and priority support. Would you like me to provide more details about what's included in each plan?",
    sender: "bot",
    sources: [
      {
        documentId: "1",
        documentName: "Product Manual.pdf",
        relevance: 0.92
      },
      {
        documentId: "2",
        documentName: "Support FAQ.docx",
        relevance: 0.78
      }
    ],
    created_at: new Date()
  },
  {
    id: "4",
    chatbot_id: "1",
    session_id: "session-123",
    text: "Yes, please tell me more about the premium plan features.",
    sender: "user",
    created_at: new Date()
  }
];

// Sample chatbot settings
export const sampleChatbotSettings: ChatbotSettings = {
  name: "Product Support Bot",
  description: "An AI assistant to help customers with product information and support.",
  welcome_message: "Hello! I'm your product support assistant. How can I help you today?",
  primary_color: "#7E69AB",
  tone: "professional",
  max_tokens: 2048,
  include_sources: true
};
