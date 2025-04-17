
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChatbotSettings } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface CustomizationPanelProps {
  settings: ChatbotSettings;
  onSettingsChange: (settings: ChatbotSettings) => void;
}

const CustomizationPanel = ({
  settings,
  onSettingsChange,
}: CustomizationPanelProps) => {
  const [tempSettings, setTempSettings] = useState<ChatbotSettings>({...settings});
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const predefinedColors = [
    "#7E69AB", // Purple
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#000000", // Black
  ];

  const handleChange = (key: keyof ChatbotSettings, value: any) => {
    setTempSettings({
      ...tempSettings,
      [key]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSettingsChange(tempSettings);
    toast({
      title: "Settings saved",
      description: "Your chatbot customization settings have been updated.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
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
            value={tempSettings.welcomeMessage}
            onChange={(e) => handleChange("welcomeMessage", e.target.value)}
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
            <Badge variant="outline">{tempSettings.maxTokens}</Badge>
          </div>
          <Slider
            id="maxTokens"
            value={[tempSettings.maxTokens]}
            min={256}
            max={4096}
            step={128}
            onValueChange={(value) => handleChange("maxTokens", value[0])}
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
            checked={tempSettings.includeSources}
            onCheckedChange={(checked) => handleChange("includeSources", checked)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">Save Settings</Button>
    </form>
  );
};

export default CustomizationPanel;
