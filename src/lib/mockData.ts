
import { ChatMessage, Document, ChatbotSettings } from "@/types";

export const mockDocuments: Document[] = [
  {
    id: "doc-1",
    name: "Company Handbook.pdf",
    type: "pdf",
    size: 2457600, // 2.4 MB
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
    status: "completed",
    chunks: 24,
  },
  {
    id: "doc-2",
    name: "Product Documentation.docx",
    type: "docx",
    size: 1843200, // 1.8 MB
    uploadedAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
    status: "completed",
    chunks: 18,
  },
  {
    id: "doc-3",
    name: "FAQ.txt",
    type: "txt",
    size: 256000, // 256 KB
    uploadedAt: new Date(Date.now() - 3600000 * 1), // 1 hour ago
    status: "processing",
  },
  {
    id: "doc-4",
    name: "https://example.com/blog",
    type: "url",
    size: 1024000, // 1 MB
    uploadedAt: new Date(Date.now() - 3600000 * 0.5), // 30 minutes ago
    status: "processing",
  },
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: "msg-1",
    text: "What are the main features of your product?",
    sender: "user",
    timestamp: new Date(Date.now() - 60000 * 5), // 5 minutes ago
  },
  {
    id: "msg-2",
    text: "Our product offers seamless document processing, advanced vector search, and customizable AI chatbots. The key features include document parsing for various formats, intelligent chunking with semantic boundaries, and efficient context retrieval for accurate responses.",
    sender: "bot",
    timestamp: new Date(Date.now() - 60000 * 4.5), // 4.5 minutes ago
    sources: [
      {
        documentId: "doc-2",
        documentName: "Product Documentation.docx",
        relevance: 0.92,
      },
    ],
  },
  {
    id: "msg-3",
    text: "How does the context retrieval system work?",
    sender: "user",
    timestamp: new Date(Date.now() - 60000 * 2), // 2 minutes ago
  },
  {
    id: "msg-4",
    text: "Our context retrieval system uses a token-aware approach to maximize efficiency. It implements hybrid search combining semantic and keyword matching to find the most relevant information. The system also includes conversation memory to maintain context across multiple interactions, and uses compression techniques to fit more information within token limits.",
    sender: "bot",
    timestamp: new Date(Date.now() - 60000 * 1.5), // 1.5 minutes ago
    sources: [
      {
        documentId: "doc-1",
        documentName: "Company Handbook.pdf",
        relevance: 0.78,
      },
      {
        documentId: "doc-2",
        documentName: "Product Documentation.docx",
        relevance: 0.95,
      },
    ],
  },
];

export const defaultChatbotSettings: ChatbotSettings = {
  name: "QueryBot",
  primaryColor: "#7E69AB",
  welcomeMessage: "Hello! I'm your knowledge assistant. Ask me anything about the uploaded documents.",
  tone: "professional",
  maxTokens: 1024,
  includeSources: true,
};
