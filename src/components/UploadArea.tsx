
import { useState } from "react";
import { FileInput } from "@/components/ui/file-input";
import { toast } from "@/components/ui/use-toast";
import { Document } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface UploadAreaProps {
  chatbotId: string;
  onDocumentsAdded: (documents: Document[]) => void;
}

const UploadArea = ({ chatbotId, onDocumentsAdded }: UploadAreaProps) => {
  const handleFilesSelected = async (files: File[]) => {
    try {
      // First, create document records in pending state
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
        ...doc,
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at.toISOString()
      }));

      const { data, error } = await supabase
        .from("documents")
        .insert(documentsToInsert)
        .select();

      if (error) throw error;

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
    }
  };

  const handleUrlAdded = async (url: string) => {
    try {
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
          ...newDocument,
          created_at: newDocument.created_at.toISOString(),
          updated_at: newDocument.updated_at.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

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
