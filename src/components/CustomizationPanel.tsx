import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Chatbot, ChatbotSettings } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2 } from "lucide-react";

interface CustomizationPanelProps {
  chatbot?: Chatbot;
  onSave: (settings: ChatbotSettings) => void;
}

const CustomizationPanel = ({ 
  chatbot, 
  onSave 
}: CustomizationPanelProps) => {
  const [tempSettings, setTempSettings] = useState<ChatbotSettings>({
    name: chatbot?.name || "Knowledge Assistant",
    description: chatbot?.description || "",
    welcome_message: chatbot?.welcome_message || "Hello! How can I help you today?",
    primary_color: chatbot?.primary_color || "#7E69AB",
    tone: chatbot?.tone || "professional",
    max_tokens: chatbot?.max_tokens || 2048,
    include_sources: chatbot?.include_sources ?? true
  });
  
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const predefinedColors = [
    "#7E69AB", "#3B82F6", "#10B981", 
    "#F59E0B", "#EF4444", "#8B5CF6", 
    "#EC4899", "#000000"
  ];

  const handleChange = (key: keyof ChatbotSettings, value: any) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCreateOrUpdateChatbot = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create or update a chatbot.",
          variant: "destructive"
        });
        return;
      }

      const chatbotData = {
        ...tempSettings,
        user_id: user.id,
      };

      let result;
      if (chatbot) {
        // Update existing chatbot
        result = await supabase
          .from('chatbots')
          .update(chatbotData)
          .eq('id', chatbot.id)
          .select()
          .single();
      } else {
        // Create new chatbot
        result = await supabase
          .from('chatbots')
          .insert(chatbotData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const savedChatbot = result.data;
      
      // Generate share link
      const shareLink = `${window.location.origin}/chatbot/${savedChatbot.share_id}`;
      setShareLink(shareLink);

      toast({
        title: "Chatbot Saved",
        description: "Your chatbot has been successfully created/updated.",
      });

      onSave(savedChatbot);
    } catch (error) {
      console.error("Error saving chatbot:", error);
      toast({
        title: "Error",
        description: "Failed to save chatbot. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link Copied",
        description: "Shareable link has been copied to clipboard."
      });
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chatbotName">Chatbot Name</Label>
          <Input
            id="chatbotName"
            value={tempSettings.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Knowledge Assistant"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md cursor-pointer border"
              style={{ backgroundColor: tempSettings.primaryColor }}
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
            />
            <Input
              id="primaryColor"
              value={tempSettings.primaryColor}
              onChange={(e) => handleChange("primaryColor", e.target.value)}
              placeholder="#7E69AB"
              className="w-28"
            />
          </div>
          {colorPickerOpen && (
            <div className="flex flex-wrap gap-2 mt-2">
              {predefinedColors.map((color) => (
                <div
                  key={color}
                  className="w-8 h-8 rounded-md cursor-pointer border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    handleChange("primaryColor", color);
                    setColorPickerOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            value={tempSettings.welcome_message}
            onChange={(e) => handleChange("welcome_message", e.target.value)}
            placeholder="Hello! How can I help you today?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Chatbot Tone</Label>
          <RadioGroup
            value={tempSettings.tone}
            onValueChange={(value) => handleChange("tone", value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="professional" id="tone-professional" />
              <Label htmlFor="tone-professional" className="cursor-pointer">Professional</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friendly" id="tone-friendly" />
              <Label htmlFor="tone-friendly" className="cursor-pointer">Friendly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="concise" id="tone-concise" />
              <Label htmlFor="tone-concise" className="cursor-pointer">Concise</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="maxTokens">Max Response Tokens</Label>
            <Badge variant="outline">{tempSettings.max_tokens}</Badge>
          </div>
          <Slider
            id="maxTokens"
            value={[tempSettings.max_tokens]}
            min={256}
            max={4096}
            step={128}
            onValueChange={(value) => handleChange("max_tokens", value[0])}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Shorter</span>
            <span>Longer</span>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="includeSources" className="cursor-pointer">Include Sources in Responses</Label>
          <Switch
            id="includeSources"
            checked={tempSettings.include_sources}
            onCheckedChange={(checked) => handleChange("include_sources", checked)}
          />
        </div>
      </div>
      
      {shareLink && (
        <div className="border rounded-lg p-3 bg-muted/50 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-sm font-medium">Shareable Link</p>
            <p className="text-xs text-muted-foreground truncate">{shareLink}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Button 
        onClick={handleCreateOrUpdateChatbot} 
        className="w-full"
      >
        {chatbot ? "Update Chatbot" : "Create Chatbot"}
      </Button>
    </div>
  );
};

export default CustomizationPanel;
