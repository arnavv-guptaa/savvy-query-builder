
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, Document, ChatMessage } from "@/types";
import ChatInterface from "@/components/ChatInterface";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const SharedChatbot = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(`shared-${Date.now()}`);

  useEffect(() => {
    const fetchChatbotData = async () => {
      try {
        setIsLoading(true);
        // Fetch chatbot by share_id
        const { data: chatbotData, error: chatbotError } = await supabase
          .from("query.chatbots")
          .select("*")
          .eq("share_id", shareId)
          .single();

        if (chatbotError) throw chatbotError;

        // Fetch documents for this chatbot
        const { data: documentsData, error: documentsError } = await supabase
          .from("query.documents")
          .select("*")
          .eq("chatbot_id", chatbotData?.id)
          .eq("status", "completed");

        if (documentsError) throw documentsError;

        setChatbot(chatbotData);
        setDocuments(documentsData || []);

        // Fetch existing chat history for this session
        const { data: chatData, error: chatError } = await supabase
          .from("query.chat_messages")
          .select("*")
          .eq("chatbot_id", chatbotData?.id)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (chatError) throw chatError;
        setChatHistory(chatData || []);
      } catch (error) {
        console.error("Error fetching chatbot:", error);
        toast({
          title: "Chatbot Not Found",
          description: "The requested chatbot does not exist or is not publicly accessible.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (shareId) {
      fetchChatbotData();
    }
  }, [shareId, sessionId]);

  const handleSendMessage = async (message: string) => {
    if (!chatbot) return;
    
    try {
      setIsMessageLoading(true);
      
      // Add user message to local state immediately for better UX
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatbot_id: chatbot.id,
        session_id: sessionId,
        text: message,
        sender: "user",
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // Call the edge function to generate a response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message,
          chatbotId: chatbot.id,
          sessionId,
          documentIds: documents.map(doc => doc.id)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate response");
      }
      
      const data = await response.json();
      
      // Refresh chat history from database to get the persisted messages
      const { data: updatedChatData, error: chatError } = await supabase
        .from("query.chat_messages")
        .select("*")
        .eq("chatbot_id", chatbot.id)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
        
      if (chatError) throw chatError;
      setChatHistory(updatedChatData || []);
      
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
      
      // If an error occurs, add a fallback bot message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        chatbot_id: chatbot.id,
        session_id: sessionId,
        text: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sender: "bot",
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsMessageLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chatbot Not Found</h2>
          <p className="text-muted-foreground">The requested chatbot does not exist or is not publicly accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{chatbot.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatInterface 
            chatHistory={chatHistory}
            documents={documents}
            settings={{
              name: chatbot.name,
              primary_color: chatbot.primary_color,
              welcome_message: chatbot.welcome_message,
              tone: chatbot.tone,
              max_tokens: chatbot.max_tokens,
              include_sources: chatbot.include_sources
            }}
            onSendMessage={handleSendMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedChatbot;
