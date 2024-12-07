// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import process from "node:process";
import { corsHeaders } from "../_shared/cors.ts";
import { SupabaseVectorStore } from "https://esm.sh/@langchain/community@0.3.17/vectorstores/supabase";
import { OpenAIEmbeddings } from "https://esm.sh/@langchain/openai@0.3.14";
import { ConversationalRetrievalQAChain } from "https://esm.sh/langchain@0.3.6/chains";
import { ChatOpenAI } from "https://esm.sh/@langchain/openai@0.3.14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.1";
// import { OpenAI } from "npm:openai@4.76.0";
// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

console.log("Hello from Functions!");

const supabase = createClient(
  process.env.SUPABASE_URL!,
  // process.env.SUPABASE_ANON_KEY!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const model = new ChatOpenAI({
  modelName: "gpt-4-turbo",
  temperature: 0,
  maxTokens: 1000,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // const { apiKey } = await req.json();
  // const data = {
  //   message: `Hello ${name}!`,
  // };

  const vectorStore = new SupabaseVectorStore(
    new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      model: "text-embedding-3-small",
    }),
    {
      client: supabase,
      tableName: "influencer_vectors",
      queryName: "match_influencer_vectors",
      filter: { source: "29p8kIqyU_Y" },
    },
  );

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
  );

  const res = await chain.invoke({
    question: "summarize it",
    chat_history: "",
  });

  // const completion = await openai.chat.completions.create({
  //   messages: [{ role: "user", content: "hello" }],
  //   model: "gpt-3.5-turbo",
  // });

  return new Response(
    JSON.stringify({ text: res.text }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );

  // return new Response(
  //   JSON.stringify(data),
  //   { headers: { "Content-Type": "application/json" } },
  // );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/openai' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
