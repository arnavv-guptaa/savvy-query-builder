
import { useState, useEffect } from "react";
import { Document } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileType, FileText, File, Globe, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface KnowledgeBaseProps {
  documents: Document[];
  onDeleteDocument: (documentId: string) => void;
}

const KnowledgeBase = ({ documents, onDeleteDocument }: KnowledgeBaseProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [uniqueDocuments, setUniqueDocuments] = useState<Document[]>([]);
  
  // Process documents to remove duplicates
  useEffect(() => {
    const documentsMap = new Map<string, Document>();
    
    // Process documents to get the unique ones by ID
    documents.forEach(doc => {
      documentsMap.set(doc.id, doc);
    });
    
    // Convert the map values to an array and sort by creation date (newest first)
    const sortedDocuments = Array.from(documentsMap.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    setUniqueDocuments(sortedDocuments);
  }, [documents]);
  
  const filteredDocuments = uniqueDocuments.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDocumentIcon = (doc: Document) => {
    switch (doc.type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "txt":
        return <File className="h-5 w-5 text-gray-500" />;
      case "url":
        return <Globe className="h-5 w-5 text-green-500" />;
      default:
        return <FileType className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold">Knowledge Base</h2>
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-8 w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredDocuments.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted py-2.5 px-4 text-sm font-medium grid grid-cols-12 gap-4">
            <div className="col-span-6">Document</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Chunks</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="py-3 px-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 flex items-center gap-2 truncate">
                  {getDocumentIcon(doc)}
                  <span className="truncate" title={doc.name}>{doc.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(doc.created_at, { addSuffix: true })}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {formatFileSize(doc.size)}
                </div>
                <div className="col-span-2 text-sm">
                  {doc.status === 'completed' ? (
                    <span>{doc.chunks} chunks</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                <div className="col-span-1">
                  {doc.status === 'processing' ? (
                    <div className="flex items-center text-amber-500">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      <span className="text-xs">Processing</span>
                    </div>
                  ) : doc.status === 'completed' ? (
                    <div className="text-green-500 text-xs">Completed</div>
                  ) : (
                    <div className="text-red-500 text-xs">Failed</div>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteDocument(doc.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No documents match your search query."
              : "Your knowledge base is empty. Upload documents to get started."}
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
