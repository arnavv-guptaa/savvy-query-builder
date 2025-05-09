
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, ChatMessage, Document } from "@/types";
import ChatInterface from "@/components/ChatInterface";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SharedChatbot = () => {
  const { shareId } = useParams();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChatbotAndDocs = async () => {
      try {
        setIsLoading(true);
        
        // Fetch chatbot
        const { data: chatbotData, error: chatbotError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("share_id", shareId)
          .single();

        if (chatbotError) throw chatbotError;

        const formattedChatbot: Chatbot = {
          ...chatbotData,
          created_at: new Date(chatbotData.created_at),
          updated_at: new Date(chatbotData.updated_at),
          tone: chatbotData.tone as 'professional' | 'friendly' | 'concise'
        };
        
        setChatbot(formattedChatbot);
        
        // Fetch documents for the chatbot
        const { data: docsData, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .eq("chatbot_id", chatbotData.id)
          .order("created_at", { ascending: false });
          
        if (docsError) throw docsError;
        
        // Format documents data
        const formattedDocs: Document[] = docsData.map(doc => ({
          ...doc,
          created_at: new Date(doc.created_at),
          updated_at: new Date(doc.updated_at),
          type: doc.type as 'pdf' | 'docx' | 'txt' | 'url',
          status: doc.status as 'processing' | 'completed' | 'failed',
          chunks: doc.chunks || null,
          upload_path: doc.upload_path || null,
          url: doc.url || null
        }));
        
        setDocuments(formattedDocs);
        
      } catch (error) {
        console.error("Error fetching chatbot:", error);
        toast({
          title: "Error",
          description: "Failed to load chatbot. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (shareId) {
      fetchChatbotAndDocs();
    }
  }, [shareId]);

  const updateChatHistory = (newHistory: ChatMessage[]) => {
    setChatHistory(newHistory);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Chatbot not found</p>
      </div>
    );
  }

  // Prepare the settings for ChatInterface
  const settings = {
    name: chatbot.name,
    description: chatbot.description || '',
    welcome_message: chatbot.welcome_message,
    primary_color: chatbot.primary_color,
    tone: chatbot.tone,
    max_tokens: chatbot.max_tokens,
    include_sources: chatbot.include_sources
  };

  return (
    <div className="min-h-screen">
      <div className="container py-6 mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">{chatbot.name}</h1>
        {chatbot.description && (
          <p className="text-muted-foreground mb-6">{chatbot.description}</p>
        )}
        <ChatInterface
          chatHistory={chatHistory}
          documents={documents}
          settings={settings}
          onSendMessage={() => {}} // This is not used anymore
          updateChatHistory={updateChatHistory}
        />
      </div>
    </div>
  );
};

export default SharedChatbot;
