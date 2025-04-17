
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const claudeApiKey = Deno.env.get("CLAUDE_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, chatbotId, sessionId, documentIds } = await req.json();
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Fetch the chatbot settings
    const { data: chatbot, error: chatbotError } = await supabase
      .from("query.chatbots")
      .select("*")
      .eq("id", chatbotId)
      .single();
    
    if (chatbotError) throw new Error(`Error fetching chatbot: ${chatbotError.message}`);
    
    // Fetch relevant documents content for context
    const { data: documents, error: documentsError } = await supabase
      .from("query.documents")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .in("id", documentIds || [])
      .eq("status", "completed");
    
    if (documentsError) throw new Error(`Error fetching documents: ${documentsError.message}`);
    
    // Prepare document content as context (simplified for now)
    const documentContext = documents && documents.length > 0 
      ? `Context from documents:\n${documents.map(doc => `Document: ${doc.name}\nContent: ${doc.content || 'No content available'}`).join('\n\n')}`
      : "No specific document context available.";
    
    // Create system prompt based on chatbot settings
    let systemPrompt = "You are a helpful AI assistant that answers questions based on provided context.";
    
    if (chatbot.tone === "professional") {
      systemPrompt += " Respond in a formal, professional tone with precise information.";
    } else if (chatbot.tone === "friendly") {
      systemPrompt += " Respond in a warm, conversational tone that's approachable and helpful.";
    } else if (chatbot.tone === "concise") {
      systemPrompt += " Respond with brief, to-the-point answers that are clear and efficient.";
    }
    
    // Save user message to database
    const { data: userMessage, error: userMessageError } = await supabase
      .from("query.chat_messages")
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        text: message,
        sender: "user"
      })
      .select()
      .single();
    
    if (userMessageError) throw new Error(`Error saving user message: ${userMessageError.message}`);
    
    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: chatbot.max_tokens,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `${documentContext}\n\nUser question: ${message}\n\nPlease answer the question based on the provided context.`
          }
        ]
      })
    });
    
    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json();
      throw new Error(`Claude API error: ${errorData.error?.message || claudeResponse.statusText}`);
    }
    
    const claudeData = await claudeResponse.json();
    const aiResponseText = claudeData.content?.[0]?.text || "Sorry, I couldn't generate a response.";
    
    // Find relevant document sources based on a simple matching algorithm
    const relevantSources = documents
      .filter(doc => doc.content && doc.content.toLowerCase().includes(message.toLowerCase()))
      .map(doc => ({
        documentId: doc.id,
        documentName: doc.name,
        relevance: 0.8 // Simplified relevance score
      }))
      .slice(0, 3); // Limit to top 3 sources
    
    // Save AI response to database
    const { data: botMessage, error: botMessageError } = await supabase
      .from("query.chat_messages")
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        text: aiResponseText,
        sender: "bot",
        sources: chatbot.include_sources ? relevantSources : null
      })
      .select()
      .single();
    
    if (botMessageError) throw new Error(`Error saving bot message: ${botMessageError.message}`);
    
    return new Response(
      JSON.stringify({
        id: botMessage.id,
        text: aiResponseText,
        sources: chatbot.include_sources ? relevantSources : null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
