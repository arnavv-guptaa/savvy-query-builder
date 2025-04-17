
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Info } from "lucide-react";
import { ChatMessage, Document, ChatbotSettings } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  documents: Document[];
  settings: ChatbotSettings;
  onSendMessage: (message: string) => void;
}

const ChatInterface = ({
  chatHistory,
  documents,
  settings,
  onSendMessage,
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const renderSource = (source: ChatMessage["sources"][0]) => {
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
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      <div className="p-3 border-b bg-muted/50 flex items-center">
        <div 
          className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: settings.primaryColor }}
        >
          {settings.name.charAt(0)}
        </div>
        <h3 className="font-medium">{settings.name}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="mb-2">{settings.welcomeMessage}</p>
              <p className="text-sm">Ask a question to get started.</p>
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div
                className={`chat-bubble ${
                  msg.sender === "user" ? "user" : "bot"
                }`}
              >
                <div>{msg.text}</div>
                {msg.sender === "bot" && msg.sources && msg.sources.length > 0 && settings.includeSources && (
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
                {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
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
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" size="icon" disabled={!message.trim()}>
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
