import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "@/types";
import { useMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import Nav from "@/components/Nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Plus, Loader2, Settings, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [newChatbotName, setNewChatbotName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("chatbots")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        // Convert date strings to Date objects
        const formattedChatbots: Chatbot[] = (data || []).map(chatbot => ({
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
          description: "Failed to load your chatbots. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatbots();
  }, []);
  
  const handleCreateChatbot = async () => {
    if (!newChatbotName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your chatbot.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      const { data, error } = await supabase
        .from("chatbots")
        .insert({
          name: newChatbotName,
          welcome_message: "Hello! How can I help you today?",
          primary_color: "#7E69AB",
          tone: "professional"
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert date strings to Date objects
      const newChatbot: Chatbot = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        tone: data.tone as 'professional' | 'friendly' | 'concise'
      };
      
      setChatbots(prev => [newChatbot, ...prev]);
      setShowCreateDialog(false);
      setNewChatbotName("");
      
      // Navigate to the edit page for the new chatbot
      navigate(`/chatbot/edit/${data.id}`);
      
      toast({
        title: "Success",
        description: "Chatbot created successfully."
      });
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
  
  const handleDeleteChatbot = async () => {
    if (!selectedChatbot) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from("chatbots")
        .delete()
        .eq("id", selectedChatbot.id);
        
      if (error) throw error;
      
      setChatbots(chatbots.filter(chatbot => chatbot.id !== selectedChatbot.id));
      setShowDeleteDialog(false);
      setSelectedChatbot(null);
      
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
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Chatbots</h1>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Chatbot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new AI Chatbot</DialogTitle>
                <DialogDescription>
                  Give your chatbot a name. You can customize it further after creation.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Input
                  placeholder="Chatbot name"
                  value={newChatbotName}
                  onChange={(e) => setNewChatbotName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChatbot} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chatbots.length === 0 ? (
          <Card className="text-center p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <CardTitle>No chatbots yet</CardTitle>
              <CardDescription>
                Create your first AI chatbot to get started.
              </CardDescription>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Chatbot
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="truncate">{chatbot.name}</CardTitle>
                      <CardDescription>
                        Created {chatbot.created_at.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedChatbot(chatbot);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div 
                    className="w-full h-2 rounded-full mb-4"
                    style={{ backgroundColor: chatbot.primary_color }}
                  />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tone:</span>
                      <span className="capitalize">{chatbot.tone}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sources:</span>
                      <span>{chatbot.include_sources ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 pt-2">
                  <Button 
                    className="flex-1"
                    variant="default"
                    onClick={() => navigate(`/chatbot/edit/${chatbot.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    className="flex-1"
                    variant="outline"
                    onClick={() => window.open(`/chatbot/${chatbot.share_id}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedChatbot?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChatbot}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
