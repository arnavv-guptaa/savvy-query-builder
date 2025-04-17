
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chatbot } from "@/types";
import { toast } from "@/hooks/use-toast";
import Nav from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, ChevronRight, Link, Trash2, 
  Settings, PlusCircle, Loader2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newChatbotName, setNewChatbotName] = useState("");
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }
        
        const { data, error } = await supabase
          .from("query.chatbots")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        setChatbots(data || []);
      } catch (error) {
        console.error("Error fetching chatbots:", error);
        toast({
          title: "Error",
          description: "Failed to load your chatbots. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatbots();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);
  
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }
      
      const { data, error } = await supabase
        .from("query.chatbots")
        .insert({
          user_id: user.id,
          name: newChatbotName,
          welcome_message: "Hello! How can I help you today?",
          primary_color: "#7E69AB",
          tone: "professional",
          max_tokens: 2048,
          include_sources: true
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setChatbots(prev => [data, ...prev]);
      setNewChatbotName("");
      setShowNewDialog(false);
      
      // Navigate to the edit page
      navigate(`/chatbot/edit/${data.id}`);
      
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
        .from("query.chatbots")
        .delete()
        .eq("id", selectedChatbot.id);
        
      if (error) throw error;
      
      setChatbots(prev => prev.filter(b => b.id !== selectedChatbot.id));
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
  
  const handleShareChatbot = (chatbot: Chatbot) => {
    const shareLink = `${window.location.origin}/chatbot/${chatbot.share_id}`;
    setShareLink(shareLink);
    setShowShareDialog(true);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Success",
      description: "Link copied to clipboard."
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Chatbots</h1>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Chatbot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chatbot</DialogTitle>
                <DialogDescription>
                  Give your chatbot a name to get started. You can customize it further later.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Chatbot Name</Label>
                  <Input 
                    id="name" 
                    placeholder="E.g., Customer Support Assistant" 
                    value={newChatbotName}
                    onChange={(e) => setNewChatbotName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateChatbot} disabled={isCreating}>
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
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chatbots.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/50">
            <h2 className="text-xl font-medium mb-2">No Chatbots Yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first AI chatbot to get started
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Chatbot
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div 
                    className="w-10 h-10 rounded-md mb-2 flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: chatbot.primary_color }}
                  >
                    {chatbot.name.charAt(0)}
                  </div>
                  <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {chatbot.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Tone:</span> 
                      <span className="capitalize">{chatbot.tone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Created:</span> 
                      <span>{new Date(chatbot.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/chatbot/edit/${chatbot.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShareChatbot(chatbot)}>
                        <Link className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/chatbot/${chatbot.share_id}`)}>
                        <ChevronRight className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedChatbot(chatbot);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      {/* Share Link Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chatbot</DialogTitle>
            <DialogDescription>
              Share this link with anyone you want to access this chatbot.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button onClick={handleCopyLink}>
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chatbot "{selectedChatbot?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChatbot}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
