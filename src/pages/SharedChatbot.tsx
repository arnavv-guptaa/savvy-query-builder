
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, Document, ChatMessage } from "@/types";
import ChatInterface from "@/components/ChatInterface";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SharedChatbot = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchChatbotData = async () => {
      try {
        // Fetch chatbot by share_id
        const { data: chatbotData, error: chatbotError } = await supabase
          .from('chatbots')
          .select('*')
          .eq('share_id', shareId)
          .single();

        if (chatbotError) throw chatbotError;

        // Fetch documents for this chatbot
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('chatbot_id', chatbotData.id)
          .eq('status', 'completed');

        if (documentsError) throw documentsError;

        setChatbot(chatbotData);
        setDocuments(documentsData || []);
      } catch (error) {
        console.error("Error fetching chatbot:", error);
        toast({
          title: "Chatbot Not Found",
          description: "The requested chatbot does not exist or is not publicly accessible.",
          variant: "destructive"
        });
      }
    };

    if (shareId) {
      fetchChatbotData();
    }
  }, [shareId]);

  const handleSendMessage = async (message: string) => {
    if (!chatbot) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      chatbot_id: chatbot.id,
      session_id: 'shared-session',
      text: message,
      sender: "user",
      created_at: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Simulate bot response (replace with actual AI logic)
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        chatbot_id: chatbot.id,
        session_id: 'shared-session',
        text: `This is a simulated response for the shared chatbot "${chatbot.name}"`,
        sender: "bot",
        sources: documents
          .slice(0, 2)
          .map(doc => ({
            documentId: doc.id,
            documentName: doc.name,
            relevance: Math.random() * 0.3 + 0.7
          })),
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, botMessage]);
    }, 1500);
  };

  if (!chatbot) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading chatbot...
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
              primaryColor: chatbot.primary_color,
              welcomeMessage: chatbot.welcome_message,
              tone: chatbot.tone,
              maxTokens: chatbot.max_tokens,
              includeSources: chatbot.include_sources
            }}
            onSendMessage={handleSendMessage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedChatbot;
