
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Nav from "@/components/Nav";
import UploadArea from "@/components/UploadArea";
import KnowledgeBase from "@/components/KnowledgeBase";
import ChatInterface from "@/components/ChatInterface";
import CustomizationPanel from "@/components/CustomizationPanel";
import { ChatMessage, Document, ChatbotSettings } from "@/types";
import { mockDocuments, mockChatHistory, defaultChatbotSettings } from "@/lib/mockData";
import { Bot, Settings, Database } from "lucide-react";

const Index = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockChatHistory);
  const [settings, setSettings] = useState<ChatbotSettings>(defaultChatbotSettings);
  const [activeTab, setActiveTab] = useState("knowledge");

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

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(documents.filter(doc => doc.id !== documentId));
  };

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      text: message,
      sender: "user",
      timestamp: new Date()
    };
    
    setChatHistory([...chatHistory, userMessage]);
    
    // Simulate bot thinking
    setTimeout(() => {
      // Generate a response based on tone
      let response = "";
      
      if (settings.tone === "professional") {
        response = `Based on the information in your knowledge base, ${message.toLowerCase().includes("how") ? "the process involves" : "I can confirm that"} several key points are relevant to your query. The documents indicate that ${message.toLowerCase().includes("what") ? "the concept encompasses" : "it's characterized by"} specific attributes that align with best practices in the industry.`;
      } else if (settings.tone === "friendly") {
        response = `Great question! I looked through your documents and found some interesting information about that. ${message.toLowerCase().includes("how") ? "Here's how it works" : "Here's what I found"}: your documents mention several helpful points that I think will answer your question.`;
      } else { // concise
        response = `${message.toLowerCase().includes("what") ? "Your documents define this as" : "According to your knowledge base,"} a structured approach with specific implementation details aimed at maximizing efficiency and accuracy.`;
      }
      
      // Add bot response
      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        text: response,
        sender: "bot",
        timestamp: new Date(),
        sources: documents
          .filter(doc => doc.status === "completed")
          .slice(0, 2)
          .map(doc => ({
            documentId: doc.id,
            documentName: doc.name,
            relevance: Math.random() * 0.3 + 0.7 // Random relevance between 0.7 and 1.0
          }))
      };
      
      setChatHistory(prevHistory => [...prevHistory, botMessage]);
    }, 1500);
  };

  const handleSettingsChange = (newSettings: ChatbotSettings) => {
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Your AI Chatbot</CardTitle>
                <CardDescription>
                  Upload documents to create a custom knowledge base for your AI chatbot
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
                    <UploadArea onDocumentsAdded={handleDocumentsAdded} />
                    
                    <Separator />
                    
                    <KnowledgeBase 
                      documents={documents} 
                      onDeleteDocument={handleDeleteDocument} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="settings">
                    <CustomizationPanel 
                      settings={settings} 
                      onSettingsChange={handleSettingsChange} 
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

export default Index;
