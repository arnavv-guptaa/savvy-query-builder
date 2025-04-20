
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Info } from "lucide-react";
import { ChatMessage, Document, ChatbotSettings } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  documents: Document[];
  settings: ChatbotSettings;
  onSendMessage: (message: string) => void;
  updateChatHistory?: (messages: ChatMessage[]) => void;
}

const ChatInterface = ({
  chatHistory,
  documents,
  settings,
  onSendMessage,
  updateChatHistory,
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      try {
        setIsLoading(true);
        
        // Create a unique session ID if not already using one
        let sessionId = "";
        if (chatHistory.length > 0) {
          sessionId = chatHistory[0].session_id;
        } else {
          sessionId = `session-${Date.now()}`;
        }
        
        // Create a new user message
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chatbot_id: settings.name, // Using name as ID for now
          session_id: sessionId,
          text: message,
          sender: 'user',
          created_at: new Date(),
        };
        
        // Add user message to chat history via the parent component if available
        if (updateChatHistory) {
          updateChatHistory([...chatHistory, userMessage]);
        }
        
        // Call the generate-response edge function
        const { data, error } = await supabase.functions.invoke('generate-response', {
          body: {
            chatbotId: userMessage.chatbot_id,
            sessionId: userMessage.session_id,
            message: userMessage.text,
            documentIds: documents.map(doc => doc.id)
          }
        });
        
        if (error) {
          throw new Error(`Error calling generate-response: ${error.message}`);
        }
        
        // Create bot message from response
        const botMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chatbot_id: userMessage.chatbot_id,
          session_id: userMessage.session_id,
          text: data.response,
          sender: 'bot',
          sources: data.sources,
          created_at: new Date(),
        };
        
        // Update chat history with the bot response
        if (updateChatHistory) {
          updateChatHistory([...chatHistory, userMessage, botMessage]);
        } else {
          // If updateChatHistory not provided, use the onSendMessage callback
          onSendMessage(message);
        }
        
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderSource = (source: ChatMessage["sources"][0]) => {
    if (!source) return null;
    
    const document = documents.find(doc => doc.id === source.documentId);
    if (!document) return null;

    return (
      <div key={source.documentId} className="flex items-center gap-1 text-xs">
        <span className="font-medium">{document.name}</span>
        <span className="text-muted-foreground">
          ({Math.round(source.relevance * 100)}% match)
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-card">
      <div className="p-3 border-b bg-muted/50 flex items-center">
        <div 
          className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: settings.primary_color }}
        >
          {settings.name.charAt(0)}
        </div>
        <h3 className="font-medium">{settings.name}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">{settings.welcome_message}</p>
              <p className="text-sm">Ask a question to get started.</p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div
                className={`${
                  msg.sender === "user" 
                    ? "bg-muted ml-auto max-w-[80%] rounded-l-lg rounded-tr-lg" 
                    : "bg-primary text-primary-foreground mr-auto max-w-[80%] rounded-r-lg rounded-tl-lg"
                } p-3`}
              >
                <div>{msg.text}</div>
                {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && settings.include_sources && (
                  <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                    <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                      <Info className="h-3 w-3" />
                      <span>Sources:</span>
                    </div>
                    <div className="space-y-1">
                      {msg.sources.map(renderSource)}
                    </div>
                  </div>
                )}
              </div>
              <div
                className={`text-xs text-muted-foreground ${
                  msg.sender === "user" ? "text-right" : "text-left"
                } mt-1`}
              >
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Ask a question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" size="icon" disabled={!message.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
