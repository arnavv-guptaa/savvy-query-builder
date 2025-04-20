
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
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatbot_id: chatbotId,
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : 
              file.name.endsWith('.docx') ? 'docx' : 'txt',
        size: file.size,
        status: 'processing',
        created_at: new Date(),
        updated_at: new Date()
      }));

      // Add the documents to the database
      const documentsToInsert = newDocuments.map(doc => ({
        id: doc.id,
        chatbot_id: doc.chatbot_id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        status: doc.status,
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at.toISOString()
      }));

      const { data, error } = await supabase
        .from("documents")
        .insert(documentsToInsert)
        .select();

      if (error) {
        console.error("Error inserting documents:", error);
        throw error;
      }

      console.log("Documents inserted successfully:", data);

      // Format the returned documents
      const formattedDocs: Document[] = data.map(doc => ({
        ...doc,
        created_at: new Date(doc.created_at),
        updated_at: new Date(doc.updated_at),
        type: doc.type as 'pdf' | 'docx' | 'txt' | 'url',
        status: doc.status as 'processing' | 'completed' | 'failed',
        chunks: doc.chunks || null,
        upload_path: doc.upload_path || null,
        url: doc.url || null
      }));

      onDocumentsAdded(formattedDocs);
      
      toast({
        title: "Documents uploaded",
        description: `${files.length} document${files.length > 1 ? 's' : ''} added to your knowledge base.`,
      });

      // Simulate processing completion after delay
      setTimeout(async () => {
        // Update status to completed 
        const updatedDocs = formattedDocs.map(doc => ({
          id: doc.id,
          status: 'completed',
          chunks: Math.floor(Math.random() * 30) + 5
        }));

        // Update the documents in the database
        for (const doc of updatedDocs) {
          await supabase
            .from("documents")
            .update(doc)
            .eq("id", doc.id);
        }

        // Update the documents in the UI
        const completedDocs = formattedDocs.map(doc => ({
          ...doc,
          status: 'completed' as const,
          chunks: Math.floor(Math.random() * 30) + 5
        }));

        onDocumentsAdded(completedDocs);
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
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatbot_id: chatbotId,
        name: url,
        type: 'url',
        size: 0,
        status: 'processing',
        url: url,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add the document to the database
      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting URL document:", error);
        throw error;
      }

      console.log("URL document inserted successfully:", data);

      // Format the returned document
      const formattedDoc: Document = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        type: data.type as 'pdf' | 'docx' | 'txt' | 'url',
        status: data.status as 'processing' | 'completed' | 'failed',
        chunks: data.chunks || null,
        upload_path: data.upload_path || null,
        url: data.url || null
      };

      onDocumentsAdded([formattedDoc]);
      
      toast({
        title: "Website added",
        description: `${url} is being processed and added to your knowledge base.`,
      });

      // Simulate processing completion after delay
      setTimeout(async () => {
        // Update status to completed
        const updatedDoc = {
          id: formattedDoc.id,
          status: 'completed',
          size: Math.floor(Math.random() * 2000000) + 500000,
          chunks: Math.floor(Math.random() * 20) + 3
        };

        // Update the document in the database
        await supabase
          .from("documents")
          .update(updatedDoc)
          .eq("id", formattedDoc.id);

        // Update the document in the UI
        const completedDoc = {
          ...formattedDoc,
          status: 'completed' as const,
          size: Math.floor(Math.random() * 2000000) + 500000,
          chunks: Math.floor(Math.random() * 20) + 3
        };

        onDocumentsAdded([completedDoc]);
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
