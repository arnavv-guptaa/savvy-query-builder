
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, ChatMessage, Document } from "@/types";
import { ChatInterface } from "@/components/ChatInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";

const SharedChatbot = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState(`${Date.now()}`);
  const [processingMessage, setProcessingMessage] = useState(false);
  
  useEffect(() => {
    const fetchChatbot = async () => {
      if (!shareId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch chatbot by share_id
        const { data: chatbotData, error: chatbotError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("share_id", shareId)
          .single();
          
        if (chatbotError) {
          if (chatbotError.code === "PGRST116") {
            // Record not found
            navigate("/");
            toast({
              title: "Not Found",
              description: "The chatbot you're looking for doesn't exist.",
              variant: "destructive"
            });
            return;
          }
          throw chatbotError;
        }
        
        // Fetch documents for this chatbot
        const { data: documentsData, error: documentsError } = await supabase
          .from("documents")
          .select("*")
          .eq("chatbot_id", chatbotData.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false });
          
        if (documentsError) throw documentsError;
        
        // Format chatbot data
        const formattedChatbot: Chatbot = {
          ...chatbotData,
          created_at: new Date(chatbotData.created_at),
          updated_at: new Date(chatbotData.updated_at),
          tone: chatbotData.tone as 'professional' | 'friendly' | 'concise'
        };
        
        // Format documents data
        const formattedDocuments: Document[] = (documentsData || []).map(doc => ({
          ...doc,
          created_at: new Date(doc.created_at),
          updated_at: new Date(doc.updated_at),
          type: doc.type as 'pdf' | 'docx' | 'txt' | 'url',
          status: doc.status as 'processing' | 'completed' | 'failed'
        }));
        
        setChatbot(formattedChatbot);
        setDocuments(formattedDocuments);
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          chatbot_id: formattedChatbot.id,
          session_id: sessionId,
          text: formattedChatbot.welcome_message,
          sender: "bot",
          sources: [],
          created_at: new Date()
        };
        
        setChatHistory([welcomeMessage]);
        
      } catch (error) {
        console.error("Error fetching chatbot:", error);
        toast({
          title: "Error",
          description: "Failed to load the chatbot. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatbot();
  }, [shareId, navigate, sessionId]);
  
  const handleSendMessage = async (message: string) => {
    if (!chatbot) return;
    
    try {
      setProcessingMessage(true);
      
      // Add user message to state immediately for better UX
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}-user`,
        chatbot_id: chatbot.id,
        session_id: sessionId,
        text: message,
        sender: "user",
        sources: [],
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // Save user message to database
      const { error: msgError } = await supabase
        .from("chat_messages")
        .insert({
          chatbot_id: chatbot.id,
          session_id: sessionId,
          text: message,
          sender: "user"
        });
        
      if (msgError) throw msgError;
      
      // Call our edge function to generate response
      const response = await fetch(`https://gnrtzeqsndhqweibljtf.supabase.co/functions/v1/generate-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducnR6ZXFzbmRocXdlaWJsanRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTE2MzgsImV4cCI6MjA2MDQ4NzYzOH0.xzlNMzQt0tRsu1wQU8EMLe3qkV0ZT8QBC3Pgaf8wxYo`
        },
        body: JSON.stringify({
          message,
          chatbotId: chatbot.id,
          sessionId: sessionId,
          documentIds: documents.map(doc => doc.id)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate response");
      }
      
      // Get most recent chat history from database
      const { data: updatedChatData, error: chatError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chatbot_id", chatbot.id)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
        
      if (chatError) throw chatError;
      
      // Process the sources data to ensure it matches our expected format
      const formattedChatHistory: ChatMessage[] = (updatedChatData || []).map(msg => {
        let parsedSources = [];
        
        if (msg.sources) {
          try {
            if (typeof msg.sources === 'string') {
              parsedSources = JSON.parse(msg.sources);
            } else {
              parsedSources = Array.isArray(msg.sources) ? msg.sources : [];
            }
          } catch (e) {
            console.error("Error parsing sources:", e);
            parsedSources = [];
          }
        }
        
        return {
          ...msg,
          created_at: new Date(msg.created_at),
          sender: msg.sender as 'user' | 'bot',
          sources: parsedSources
        };
      });
      
      setChatHistory(formattedChatHistory);
      
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
        sources: [],
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setProcessingMessage(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!chatbot) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chatbot Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The chatbot you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center">
                <Bot className="h-5 w-5 mr-2" style={{ color: chatbot.primary_color }} />
                {chatbot.name}
              </h1>
              {chatbot.description && (
                <p className="text-sm text-muted-foreground mt-1">{chatbot.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" style={{ color: chatbot.primary_color }} />
              {chatbot.name}
            </CardTitle>
            {chatbot.description && (
              <CardDescription>{chatbot.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <ChatInterface 
                chatHistory={chatHistory}
                documents={documents}
                settings={{
                  ...chatbot,
                  description: chatbot.description || ""
                }}
                onSendMessage={handleSendMessage}
                isTyping={processingMessage}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SharedChatbot;
