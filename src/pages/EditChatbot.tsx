
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, Document, ChatMessage } from "@/types";
import { toast } from "@/hooks/use-toast";
import Nav from "@/components/Nav";
import CustomizationPanel from "@/components/CustomizationPanel";
import KnowledgeBase from "@/components/KnowledgeBase";
import ChatInterface from "@/components/ChatInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import UploadArea from "@/components/UploadArea";

const EditChatbot = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("customize");
  
  useEffect(() => {
    const fetchChatbotAndDocs = async () => {
      try {
        setIsLoading(true);
        
        // Fetch chatbot
        const { data: chatbotData, error: chatbotError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("id", id)
          .single();
          
        if (chatbotError) throw chatbotError;
        
        // Format chatbot data
        const formattedChatbot: Chatbot = {
          ...chatbotData,
          created_at: new Date(chatbotData.created_at),
          updated_at: new Date(chatbotData.updated_at),
          tone: chatbotData.tone as 'professional' | 'friendly' | 'concise'
        };
        
        setChatbot(formattedChatbot);
        
        // Fetch documents
        const { data: docsData, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .eq("chatbot_id", id)
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
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load chatbot data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchChatbotAndDocs();
    }
  }, [id]);

  const updateChatbot = async (chatbotData: Partial<Chatbot>) => {
    if (!chatbot) return;
    
    try {
      setIsLoading(true);
      
      // Convert dates to strings for database update
      const dataForUpdate = {
        ...chatbotData,
        created_at: chatbotData.created_at instanceof Date ? chatbotData.created_at.toISOString() : undefined,
        updated_at: chatbotData.updated_at instanceof Date ? chatbotData.updated_at.toISOString() : undefined,
      };
      
      const { data, error } = await supabase
        .from("chatbots")
        .update(dataForUpdate)
        .eq("id", chatbot.id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedChatbot: Chatbot = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        tone: data.tone as 'professional' | 'friendly' | 'concise'
      };
      
      setChatbot(updatedChatbot);
      
      toast({
        title: "Success",
        description: "Chatbot updated successfully."
      });
    } catch (error) {
      console.error("Error updating chatbot:", error);
      toast({
        title: "Error",
        description: "Failed to update chatbot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleSendMessage = (message: string) => {
    // Create a new user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatbot_id: chatbot?.id || '',
      session_id: `session-${Date.now()}`,
      text: message,
      sender: 'user',
      created_at: new Date(),
    };

    // Add the user message to the chat history
    setChatHistory(prev => [...prev, userMessage]);

    // In a real implementation, we would send the message to an API
    // For now, create a mock bot response after a delay
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatbot_id: chatbot?.id || '',
        session_id: userMessage.session_id,
        text: `This is a mock response to: "${message}"`,
        sender: 'bot',
        sources: documents.length > 0 ? [
          { 
            documentId: documents[0].id, 
            documentName: documents[0].name, 
            relevance: 0.85 
          }
        ] : undefined,
        created_at: new Date(),
      };
      
      setChatHistory(prev => [...prev, botMessage]);
    }, 1000);
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

  // Prepare the settings for CustomizationPanel
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
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{chatbot.name}</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customize" className="outline-none">
            <CustomizationPanel 
              chatbot={chatbot}
              settings={settings}
              onSettingsChange={(newSettings) => {
                if (chatbot) {
                  setChatbot({
                    ...chatbot,
                    ...newSettings
                  });
                }
              }}
              onSave={updateChatbot}
            />
          </TabsContent>
          
          <TabsContent value="knowledge" className="outline-none">
            <div className="space-y-6">
              <UploadArea 
                chatbotId={chatbot.id} 
                onDocumentsAdded={(newDocs) => {
                  setDocuments(prev => [...prev, ...newDocs]);
                }} 
              />
              <KnowledgeBase 
                documents={documents} 
                onDeleteDocument={handleDeleteDocument}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="outline-none">
            <ChatInterface 
              chatHistory={chatHistory}
              documents={documents}
              settings={settings}
              onSendMessage={handleSendMessage}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EditChatbot;
