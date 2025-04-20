import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Chatbot, ChatbotSettings } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Share2, Loader2 } from "lucide-react";

interface CustomizationPanelProps {
  chatbot?: Chatbot;
  settings: ChatbotSettings;
  onSettingsChange: (settings: ChatbotSettings) => void;
  onSave?: (settings: Partial<Chatbot>) => Promise<void>;
}

const CustomizationPanel = ({ 
  chatbot, 
  settings,
  onSettingsChange,
  onSave
}: CustomizationPanelProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(
    chatbot ? `${window.location.origin}/chatbot/${chatbot.share_id}` : null
  );
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const predefinedColors = [
    "#7E69AB", "#3B82F6", "#10B981", 
    "#F59E0B", "#EF4444", "#8B5CF6", 
    "#EC4899", "#000000"
  ];

  const handleChange = (key: keyof ChatbotSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(settings);
      
      // If the operation was successful, update the share link (if we have a chatbot)
      if (chatbot) {
        setShareLink(`${window.location.origin}/chatbot/${chatbot.share_id}`);
      }
      
      toast({
        title: "Success",
        description: "Chatbot settings saved successfully."
      });
    } catch (error) {
      console.error("Error saving chatbot:", error);
      toast({
        title: "Error",
        description: "Failed to save chatbot settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
            value={settings.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Knowledge Assistant"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary Color</Label>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md cursor-pointer border"
              style={{ backgroundColor: settings.primary_color }}
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
            />
            <Input
              id="primaryColor"
              value={settings.primary_color}
              onChange={(e) => handleChange("primary_color", e.target.value)}
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
                    handleChange("primary_color", color);
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
            value={settings.welcome_message}
            onChange={(e) => handleChange("welcome_message", e.target.value)}
            placeholder="Hello! How can I help you today?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Chatbot Tone</Label>
          <RadioGroup
            value={settings.tone}
            onValueChange={(value: "professional" | "friendly" | "concise") => handleChange("tone", value)}
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
            <Badge variant="outline">{settings.max_tokens}</Badge>
          </div>
          <Slider
            id="maxTokens"
            value={[settings.max_tokens]}
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
            checked={settings.include_sources}
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
              onClick={() => window.open(shareLink, '_blank')}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {onSave && (
        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            chatbot ? "Update Chatbot" : "Create Chatbot"
          )}
        </Button>
      )}
    </div>
  );
};

export default CustomizationPanel;
