
import { useState } from "react";
import { FileInput } from "@/components/ui/file-input";
import { toast } from "@/hooks/use-toast";
import { Document } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface UploadAreaProps {
  chatbotId: string;
  onDocumentsAdded: (documents: Document[]) => void;
}

const UploadArea = ({ chatbotId, onDocumentsAdded }: UploadAreaProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      console.log("Files selected:", files.map(f => f.name));

      // Create document records in processing state
      const newDocuments: Document[] = files.map((file) => ({
        id: crypto.randomUUID(),
        chatbot_id: chatbotId,
        name: file.name,
        type: file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'docx' | 'txt' | 'url',
        size: file.size,
        status: 'processing',
        chunks: null,
        upload_path: null,
        url: null,
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Add the documents to the database
      for (const doc of newDocuments) {
        const { error } = await supabase
          .from("documents")
          .insert({
            id: doc.id,
            chatbot_id: doc.chatbot_id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            status: doc.status,
            created_at: doc.created_at.toISOString(),
            updated_at: doc.updated_at.toISOString()
          });

        if (error) {
          console.error("Error inserting document:", error);
          throw error;
        }
      }

      console.log("Documents inserted successfully");
      onDocumentsAdded(newDocuments);
      
      toast({
        title: "Documents uploaded",
        description: `${files.length} document${files.length > 1 ? 's' : ''} added to your knowledge base.`,
      });

      // Simulate processing completion after delay
      setTimeout(async () => {
        // Update status to completed 
        const updatedDocs = newDocuments.map(doc => ({
          ...doc,
          status: 'completed' as const,
          chunks: Math.floor(Math.random() * 30) + 5
        }));

        // Update the documents in the database
        for (const doc of updatedDocs) {
          await supabase
            .from("documents")
            .update({
              status: 'completed',
              chunks: doc.chunks
            })
            .eq("id", doc.id);
        }

        // Update the documents in the UI
        onDocumentsAdded(updatedDocs);
      }, 3000);

    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Error",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlAdded = async (url: string) => {
    if (!url.trim()) return;
    
    try {
      setUploading(true);
      console.log("URL added:", url);

      const newDocument: Document = {
        id: crypto.randomUUID(),
        chatbot_id: chatbotId,
        name: url,
        type: 'url',
        size: 0,
        status: 'processing',
        chunks: null,
        upload_path: null,
        url: url,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add the document to the database
      const { error } = await supabase
        .from("documents")
        .insert({
          id: newDocument.id,
          chatbot_id: newDocument.chatbot_id,
          name: newDocument.name,
          type: newDocument.type,
          size: newDocument.size,
          status: newDocument.status,
          url: newDocument.url,
          created_at: newDocument.created_at.toISOString(),
          updated_at: newDocument.updated_at.toISOString()
        });

      if (error) {
        console.error("Error inserting URL document:", error);
        throw error;
      }

      console.log("URL document inserted successfully");
      onDocumentsAdded([newDocument]);
      
      toast({
        title: "Website added",
        description: `${url} is being processed and added to your knowledge base.`,
      });

      // Simulate processing completion after delay
      setTimeout(async () => {
        // Update status to completed
        const updatedDoc = {
          ...newDocument,
          status: 'completed' as const,
          size: Math.floor(Math.random() * 2000000) + 500000,
          chunks: Math.floor(Math.random() * 20) + 3
        };

        // Update the document in the database
        await supabase
          .from("documents")
          .update({
            status: 'completed',
            size: updatedDoc.size,
            chunks: updatedDoc.chunks
          })
          .eq("id", newDocument.id);

        // Update the document in the UI
        onDocumentsAdded([updatedDoc]);
      }, 4000);
    } catch (error) {
      console.error("Error adding URL:", error);
      toast({
        title: "Error",
        description: "Failed to add URL. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
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
