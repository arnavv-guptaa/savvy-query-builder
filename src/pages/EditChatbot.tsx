import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot, Document, ChatbotSettings, ChatMessage } from "@/types";
import { toast } from "@/hooks/use-toast";
import Nav from "@/components/Nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UploadArea from "@/components/UploadArea";
import KnowledgeBase from "@/components/KnowledgeBase";
import ChatInterface from "@/components/ChatInterface";
import CustomizationPanel from "@/components/CustomizationPanel";
import { Bot, Settings, Database, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const EditChatbot = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<ChatbotSettings>({
    name: "Knowledge Assistant",
    description: "",
    welcome_message: "Hello! How can I help you today?",
    primary_color: "#7E69AB",
    tone: "professional",
    max_tokens: 2048,
    include_sources: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("knowledge");
  const [previewSessionId, setPreviewSessionId] = useState(`preview-${Date.now()}`);

  useEffect(() => {
    const fetchChatbotData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch chatbot by ID
        const { data: chatbotData, error: chatbotError } = await supabase
          .from("chatbots")
          .select("*")
          .eq("id", id)
          .single();
        
        if (chatbotError) {
          if (chatbotError.code === "PGRST116") {
            // Record not found
            navigate("/dashboard");
            toast({
              title: "Not Found",
              description: "The chatbot you're trying to edit doesn't exist.",
              variant: "destructive"
            });
          } else {
            throw chatbotError;
          }
          return;
        }
        
        // Fetch documents for this chatbot
        const { data: documentsData, error: documentsError } = await supabase
          .from("documents")
          .select("*")
          .eq("chatbot_id", id)
          .order("created_at", { ascending: false });
        
        if (documentsError) throw documentsError;
        
        // Convert string dates to Date objects
        const formattedChatbot: Chatbot = {
          ...chatbotData,
          created_at: new Date(chatbotData.created_at),
          updated_at: new Date(chatbotData.updated_at),
          tone: chatbotData.tone as 'professional' | 'friendly' | 'concise'
        };

        const formattedDocuments: Document[] = (documentsData || []).map(doc => ({
          ...doc,
          created_at: new Date(doc.created_at),
          updated_at: new Date(doc.updated_at),
          type: doc.type as 'pdf' | 'docx' | 'txt' | 'url',
          status: doc.status as 'processing' | 'completed' | 'failed'
        }));
        
        setChatbot(formattedChatbot);
        setSettings({
          name: chatbotData.name,
          description: chatbotData.description || "",
          welcome_message: chatbotData.welcome_message,
          primary_color: chatbotData.primary_color,
          tone: chatbotData.tone as 'professional' | 'friendly' | 'concise',
          max_tokens: chatbotData.max_tokens,
          include_sources: chatbotData.include_sources
        });
        setDocuments(formattedDocuments);

        // Add welcome message for the preview
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          chatbot_id: formattedChatbot.id,
          session_id: previewSessionId,
          text: formattedChatbot.welcome_message,
          sender: "bot",
          sources: [],
          created_at: new Date()
        };
        
        setChatHistory([welcomeMessage]);
        
      } catch (error) {
        console.error("Error fetching chatbot data:", error);
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
      fetchChatbotData();
    }
  }, [id, navigate, previewSessionId]);

  const handleDocumentsAdded = (newDocuments: Document[]) => {
    // Check if any document is being updated (has same ID)
    const updatedDocs = [...documents];
    
    newDocuments.forEach(newDoc => {
      const existingIndex = updatedDocs.findIndex(doc => doc.id === newDoc.id);
      if (existingIndex >= 0) {
        updatedDocs[existingIndex] = newDoc;
      } else {
        updatedDocs.push(newDoc);
      }
    });
    
    setDocuments(updatedDocs);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
        
      if (error) throw error;
      
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Success",
        description: "Document deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSettingsChange = (newSettings: ChatbotSettings) => {
    setSettings(newSettings);
  };
  
  const handleSaveSettings = async () => {
    if (!chatbot) return;
    
    try {
      const { error } = await supabase
        .from("chatbots")
        .update({
          name: settings.name,
          description: settings.description,
          welcome_message: settings.welcome_message,
          primary_color: settings.primary_color,
          tone: settings.tone,
          max_tokens: settings.max_tokens,
          include_sources: settings.include_sources
        })
        .eq("id", chatbot.id);
        
      if (error) throw error;
      
      // Update the chatbot object
      setChatbot({
        ...chatbot,
        name: settings.name,
        description: settings.description,
        welcome_message: settings.welcome_message,
        primary_color: settings.primary_color,
        tone: settings.tone,
        max_tokens: settings.max_tokens,
        include_sources: settings.include_sources
      });
      
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  };
  
  const handleSendMessage = async (message: string) => {
    if (!chatbot) return;
    
    try {
      // Add user message to state immediately for better UX
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}-user`,
        chatbot_id: chatbot.id,
        session_id: previewSessionId,
        text: message,
        sender: "user",
        sources: [],
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // Save the message to database
      const { error: saveError } = await supabase
        .from("chat_messages")
        .insert({
          chatbot_id: chatbot.id,
          session_id: previewSessionId,
          text: message,
          sender: "user"
        });
        
      if (saveError) throw saveError;
      
      // Call API to generate response
      const response = await fetch(`https://gnrtzeqsndhqweibljtf.supabase.co/functions/v1/generate-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducnR6ZXFzbmRocXdlaWJsanRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTE2MzgsImV4cCI6MjA2MDQ4NzYzOH0.xzlNMzQt0tRsu1wQU8EMLe3qkV0ZT8QBC3Pgaf8wxYo`
        },
        body: JSON.stringify({
          message,
          chatbotId: chatbot.id,
          sessionId: previewSessionId,
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
        .eq("session_id", previewSessionId)
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
        session_id: previewSessionId,
        text: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sender: "bot",
        sources: [],
        created_at: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
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
            The chatbot you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Edit Chatbot: {chatbot.name}</h1>
          </div>
          
          <Button 
            onClick={() => window.open(`/chatbot/${chatbot.share_id}`, '_blank')}
          >
            Preview Chatbot
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customize Your AI Chatbot</CardTitle>
                <CardDescription>
                  Upload documents to create a custom knowledge base and customize your chatbot's settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="knowledge" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="knowledge" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Knowledge Base
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Customization
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="knowledge" className="space-y-6">
                    <UploadArea 
                      chatbotId={chatbot.id} 
                      onDocumentsAdded={handleDocumentsAdded} 
                    />
                    
                    <Separator />
                    
                    <KnowledgeBase 
                      documents={documents} 
                      onDeleteDocument={handleDeleteDocument} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="settings">
                    <CustomizationPanel 
                      chatbot={chatbot}
                      settings={settings}
                      onSettingsChange={handleSettingsChange}
                      onSave={handleSaveSettings}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Chatbot Preview
                </CardTitle>
                <CardDescription>
                  Test your chatbot with the current settings and knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <div className="h-[500px]">
                  <ChatInterface 
                    chatHistory={chatHistory}
                    documents={documents}
                    settings={settings}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditChatbot;
