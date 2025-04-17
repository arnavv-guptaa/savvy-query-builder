
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Database, MessagesSquare } from "lucide-react";
import Nav from "@/components/Nav";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // If user is already logged in, redirect to dashboard
        navigate('/dashboard');
      }
    };
    
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      
      <main className="flex-1 container py-12 px-4 flex flex-col items-center justify-center">
        <div className="max-w-2xl text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Create Custom AI Chatbots from Your Documents
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Upload your documents, customize your chatbot, and share it with anyone.
            No coding required.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              <Bot className="h-5 w-5" />
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <Database className="h-5 w-5" />
              Go to Dashboard
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
            <Database className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Upload Documents</h3>
            <p className="text-muted-foreground">
              Upload PDFs, Word documents, and text files to create your custom knowledge base.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
            <Bot className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Customize Chatbot</h3>
            <p className="text-muted-foreground">
              Personalize your chatbot's appearance, tone, and behavior to match your brand.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
            <MessagesSquare className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Share with Anyone</h3>
            <p className="text-muted-foreground">
              Generate a unique link to share your AI chatbot with colleagues or customers.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Query. AI-powered chatbots.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
