
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, ChatMessage } from "@/types";
import ChatInterface from "@/components/ChatInterface";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SharedChatbot = () => {
  const { shareId } = useParams();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("chatbots")
          .select("*")
          .eq("share_id", shareId)
          .single();

        if (error) throw error;

        setChatbot({
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
          tone: data.tone as 'professional' | 'friendly' | 'concise'
        });
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
      fetchChatbot();
    }
  }, [shareId]);

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

  return (
    <div className="min-h-screen">
      <ChatInterface
        chatbot={chatbot}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
};

export default SharedChatbot;
