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

  const { apiKey, videoId } = await req.json();

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
      filter: { source: videoId },
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
    question:
      `You are writing a brief personalized message for an influencer outreach email. Using the provided context from their video content, create a genuine and specific compliment that demonstrates you've watched their content.
Requirements:
- Length: 2 sentences only
- Must be specific to their content (not generic)
- Focus on their unique style, insights, or approach
- Should feel natural when inserted into: "I'm so impressed by your [YOUR MESSAGE]"
- Avoid mentioning "content" or "videos" directly (since that's implied)
- Use natural, conversational language
- Don't use superlatives like "amazing" or "incredible"
- Always end each sentence with proper punctuation (period, exclamation point, etc.)
- If the message ends mid-sentence, don't add a period
- If it's a complete sentence, make sure it ends with a period

Examples of good messages:
- clear and engaging way of explaining complex tech concepts through real-world examples.
- thoughtful approach to sustainable fashion and how you break down ethical shopping decisions.
- authentic take on mindfulness and how you integrate it into daily routines.

Bad examples (too generic):
- amazing content
- great videos and editing style
- wonderful personality in your videos

Generate only the personalized message without any additional text or explanation.`,
    chat_history: "",
  });

  return new Response(
    JSON.stringify({ text: res.text }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
