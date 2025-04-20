
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "@/types";
import { useNavigate } from "react-router-dom";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, PlusCircle, Share2, Edit, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [newChatbotName, setNewChatbotName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("chatbots")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        // Format chatbot data
        const formattedChatbots: Chatbot[] = data.map(chatbot => ({
          ...chatbot,
          created_at: new Date(chatbot.created_at),
          updated_at: new Date(chatbot.updated_at),
          tone: chatbot.tone as 'professional' | 'friendly' | 'concise'
        }));
        
        setChatbots(formattedChatbots);
      } catch (error) {
        console.error("Error fetching chatbots:", error);
        toast({
          title: "Error",
          description: "Failed to load chatbots. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatbots();
  }, []);

  const createChatbot = async () => {
    if (!newChatbotName.trim()) return;
    
    try {
      setIsCreating(true);
      
      // Default chatbot settings
      const newChatbot = {
        name: newChatbotName.trim(),
        welcome_message: "Hello! How can I help you today?",
        primary_color: "#7E69AB",
        tone: "professional",
        max_tokens: 2048,
        include_sources: true
      };
      
      const { data, error } = await supabase
        .from("chatbots")
        .insert([newChatbot])
        .select()
        .single();
        
      if (error) throw error;
      
      const formattedChatbot: Chatbot = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        tone: data.tone as 'professional' | 'friendly' | 'concise'
      };
      
      setChatbots([formattedChatbot, ...chatbots]);
      setNewChatbotName("");
      
      toast({
        title: "Success",
        description: "Chatbot created successfully."
      });
      
      // Navigate to edit page
      navigate(`/chatbot/edit/${formattedChatbot.id}`);
    } catch (error) {
      console.error("Error creating chatbot:", error);
      toast({
        title: "Error",
        description: "Failed to create chatbot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteChatbot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chatbot?")) return;
    
    try {
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      setChatbots(chatbots.filter(chatbot => chatbot.id !== id));
      
      toast({
        title: "Success",
        description: "Chatbot deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      toast({
        title: "Error",
        description: "Failed to delete chatbot. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Chatbots</h1>
        </div>
        
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Create New Chatbot</CardTitle>
              <CardDescription>
                Create a custom AI chatbot trained on your documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter chatbot name"
                  value={newChatbotName}
                  onChange={(e) => setNewChatbotName(e.target.value)}
                  disabled={isCreating}
                />
                <Button 
                  onClick={createChatbot} 
                  disabled={!newChatbotName.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : chatbots.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chatbots.map((chatbot) => (
                <Card key={chatbot.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: chatbot.primary_color }}
                        >
                          {chatbot.name.charAt(0)}
                        </div>
                        <CardTitle className="text-xl">{chatbot.name}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      Created {formatDistanceToNow(chatbot.created_at, { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {chatbot.description || chatbot.welcome_message}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/chatbot/${chatbot.share_id}`)}
                    >
                      <Bot className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const shareLink = `${window.location.origin}/chatbot/${chatbot.share_id}`;
                          navigator.clipboard.writeText(shareLink);
                          toast({
                            title: "Link Copied",
                            description: "Shareable link has been copied to clipboard."
                          });
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => navigate(`/chatbot/edit/${chatbot.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteChatbot(chatbot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg mb-1">No chatbots yet</p>
              <p className="text-muted-foreground">
                Create your first chatbot to get started.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
