
import { useState } from "react";
import { FileInput } from "@/components/ui/file-input";
import { toast } from "@/components/ui/use-toast";
import { Document } from "@/types";
import { mockDocuments } from "@/lib/mockData";

interface UploadAreaProps {
  onDocumentsAdded: (documents: Document[]) => void;
}

const UploadArea = ({ onDocumentsAdded }: UploadAreaProps) => {
  const handleFilesSelected = (files: File[]) => {
    // In a real implementation, we would upload these files to the server
    // For now, create mock document objects
    const newDocuments: Document[] = files.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'pdf' : 
            file.name.endsWith('.docx') ? 'docx' : 'txt',
      size: file.size,
      uploadedAt: new Date(),
      status: 'processing'
    }));

    onDocumentsAdded(newDocuments);
    
    toast({
      title: "Documents uploaded",
      description: `${files.length} document${files.length > 1 ? 's' : ''} added to your knowledge base.`,
    });

    // Simulate processing completion after delay
    setTimeout(() => {
      const updatedDocuments = newDocuments.map(doc => ({
        ...doc,
        status: 'completed' as const,
        chunks: Math.floor(Math.random() * 30) + 5
      }));
      onDocumentsAdded(updatedDocuments);
    }, 3000);
  };

  const handleUrlAdded = (url: string) => {
    const newDocument: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: url,
      type: 'url',
      size: 0, // Size will be determined after crawling
      uploadedAt: new Date(),
      status: 'processing'
    };

    onDocumentsAdded([newDocument]);
    
    toast({
      title: "Website added",
      description: `${url} is being processed and added to your knowledge base.`,
    });

    // Simulate processing completion after delay
    setTimeout(() => {
      const updatedDocument = {
        ...newDocument,
        status: 'completed' as const,
        size: Math.floor(Math.random() * 2000000) + 500000,
        chunks: Math.floor(Math.random() * 20) + 3
      };
      onDocumentsAdded([updatedDocument]);
    }, 4000);
  };

  return (
    <div className="w-full">
      <FileInput 
        onFilesSelected={handleFilesSelected} 
        onUrlAdded={handleUrlAdded}
        className="mb-4"
      />
    </div>
  );
};

export default UploadArea;
