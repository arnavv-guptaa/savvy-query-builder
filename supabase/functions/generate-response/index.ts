
// Follow this setup guide to integrate the Deno runtime and the Claude API:
// https://docs.anthropic.com/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { Claude } from 'https://esm.sh/@anthropic-ai/sdk@1.0.0/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatbotId, message, sessionId, messageHistory } = await req.json();
    
    // Get the Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY') || '';
    
    if (!supabaseUrl || !supabaseAnonKey || !claudeApiKey) {
      throw new Error('Environment variables are not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch the chatbot settings
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();
      
    if (chatbotError) {
      throw new Error(`Error fetching chatbot: ${chatbotError.message}`);
    }

    // Fetch completed documents for this chatbot
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('status', 'completed');
      
    if (documentsError) {
      throw new Error(`Error fetching documents: ${documentsError.message}`);
    }

    // Create a string representation of all document content
    // In a real application, you would fetch the actual document content
    const documentSummaries = documents.map(doc => 
      `Document: ${doc.name} (Type: ${doc.type}, Size: ${doc.size} bytes, Chunks: ${doc.chunks})`
    ).join('\n\n');

    // Initialize Claude API client
    const claude = new Claude({
      apiKey: claudeApiKey,
    });

    // Format the message history for Claude
    const formattedHistory = messageHistory
      ? messageHistory.map(msg => {
          if (msg.sender === 'user') {
            return { role: 'user', content: msg.text };
          } else {
            return { role: 'assistant', content: msg.text };
          }
        })
      : [];

    // Create system prompt based on chatbot settings and documents
    const systemPrompt = `
You are a helpful AI assistant named ${chatbot.name}. 
Your primary goal is to help users by answering their questions.

${chatbot.description ? `Description: ${chatbot.description}` : ''}

When responding, use a ${chatbot.tone} tone.

You have access to the following knowledge base documents:
${documentSummaries || "No documents are available in the knowledge base."}

Here are some guidelines:
1. Answer questions based on the knowledge contained in the provided documents.
2. If you don't know the answer, say so honestly instead of making something up.
3. Keep your answers thorough yet concise.
${chatbot.include_sources ? "4. Cite the source document when providing information from it." : ""}
    `;

    // Create the message for Claude
    const response = await claude.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: chatbot.max_tokens,
      system: systemPrompt,
      messages: [
        ...formattedHistory,
        { role: 'user', content: message }
      ],
    });

    console.log("Claude response:", response);

    // Save the message and response in the database
    const userMessageInsert = await supabase
      .from('chat_messages')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        sender: 'user',
        text: message,
      });

    if (userMessageInsert.error) {
      console.error("Error saving user message:", userMessageInsert.error);
    }

    // Extract the assistant's response
    const aiResponse = response.content[0].text;

    // Save the AI response to the database
    const aiMessageInsert = await supabase
      .from('chat_messages')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        sender: 'assistant',
        text: aiResponse,
        sources: response.usage || null,
      });

    if (aiMessageInsert.error) {
      console.error("Error saving AI message:", aiMessageInsert.error);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        metadata: response.usage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in generate-response function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
