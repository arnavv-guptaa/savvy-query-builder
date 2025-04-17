
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY is not set in Edge Functions secrets');
    }
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const requestData = await req.json();
    const { chatbotId, sessionId, message, documents = [] } = requestData;
    
    if (!chatbotId || !sessionId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get chatbot settings
    const { data: chatbotData, error: chatbotError } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single();
      
    if (chatbotError || !chatbotData) {
      console.error('Error fetching chatbot:', chatbotError);
      return new Response(
        JSON.stringify({ error: 'Chatbot not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get previous messages for context
    const { data: previousMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);
      
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      // Continue without context
    }
    
    // Store the user message
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        text: message,
        sender: 'user'
      });
      
    if (insertError) {
      console.error('Error storing user message:', insertError);
      // Continue anyway
    }
    
    // Format previous messages for context
    const context = (previousMessages || []).map(msg => {
      return `${msg.sender === 'user' ? 'Human' : 'Assistant'}: ${msg.text}`;
    }).join('\n');
    
    // Format document content for context
    const documentContext = documents.length > 0 
      ? `\nRelevant documents:\n${documents.map(doc => `Document: ${doc.name}\nContent: ${doc.content}`).join('\n\n')}`
      : '';
    
    // Prepare system prompt based on chatbot settings
    let systemPrompt = `You are an AI assistant that helps people find information. Your name is Query.\n`;
    systemPrompt += `Your tone should be ${chatbotData.tone || 'professional'}.\n`;
    
    if (chatbotData.include_sources && documents.length > 0) {
      systemPrompt += `When referring to information from documents, cite your sources at the end of your response in a "Sources:" section.\n`;
    }
    
    // Construct API request for Claude
    const apiEndpoint = 'https://api.anthropic.com/v1/messages';
    const apiRequest = {
      model: 'claude-3-haiku-20240307',
      max_tokens: chatbotData.max_tokens || 2048,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `${context ? `Previous conversation:\n${context}\n\n` : ''}${documentContext ? documentContext + '\n\n' : ''}Human: ${message}`
        }
      ]
    };
    
    console.log('Sending request to Claude API:', JSON.stringify(apiRequest, null, 2));
    
    // Send request to Claude API
    const claudeResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': CLAUDE_API_KEY
      },
      body: JSON.stringify(apiRequest)
    });
    
    const claudeData = await claudeResponse.json();
    
    if (!claudeResponse.ok) {
      console.error('Error from Claude API:', claudeData);
      throw new Error(`Claude API error: ${claudeData.error?.message || 'Unknown error'}`);
    }
    
    const aiResponse = claudeData.content[0].text;
    
    // Extract sources if they exist in the response
    let sources = null;
    
    if (chatbotData.include_sources && documents.length > 0) {
      // Simple pattern to extract sources section if it exists
      const sourceMatch = aiResponse.match(/Sources:([\s\S]+)$/);
      if (sourceMatch) {
        // Convert sources to the format we need for storage
        sources = documents.map(doc => ({
          documentId: doc.id,
          documentName: doc.name,
          relevance: 0.9 // Default relevance value
        }));
      }
    }
    
    // Store the AI response
    const { error: aiInsertError } = await supabase
      .from('chat_messages')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        text: aiResponse,
        sender: 'bot',
        sources: sources
      });
      
    if (aiInsertError) {
      console.error('Error storing AI response:', aiInsertError);
      // Continue anyway
    }
    
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        sources: sources
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in generate-response function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
