
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FileInputProps {
  onFilesSelected: (files: File[]) => void;
  onUrlAdded?: (url: string) => void;
  className?: string;
}

export function FileInput({ onFilesSelected, onUrlAdded, className }: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && onUrlAdded) {
      onUrlAdded(url.trim());
      setUrl("");
      setShowUrlInput(false);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg p-6 w-full",
        dragActive ? "bg-accent/50" : "upload-area",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.md,.html"
      />

      <div className="flex flex-col items-center justify-center gap-4 py-6">
        <div className="rounded-full bg-accent p-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Upload your documents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop files or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF, DOCX, TXT, MD, HTML
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-2">
          <Button variant="default" onClick={handleButtonClick}>
            <FileText className="mr-2 h-4 w-4" />
            Select Files
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <Globe className="mr-2 h-4 w-4" />
            Add Website URL
          </Button>
        </div>

        {showUrlInput && (
          <form
            onSubmit={handleUrlSubmit}
            className="flex w-full max-w-md gap-2 mt-4"
          >
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Add URL</Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowUrlInput(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
