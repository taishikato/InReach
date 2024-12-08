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
import { Redis } from "https://esm.sh/@upstash/redis@1.34.3";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@2.0.5";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "@upstash/ratelimit",
  analytics: true,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  // process.env.SUPABASE_ANON_KEY!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function ips(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(/\s*,\s*/);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientIps = ips(req) || [""];

  const { success } = await ratelimit.limit(clientIps[0]);
  if (!success) {
    console.warn("Too many requests", clientIps[0]);

    return new Response(
      JSON.stringify({ success: false }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { apiKey } = await req.json();

  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const vectorStore = new SupabaseVectorStore(
    new OpenAIEmbeddings({
      apiKey,
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

  const model = new ChatOpenAI({
    apiKey,
    modelName: "gpt-4-turbo",
    temperature: 0,
    maxTokens: 1000,
  });

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
