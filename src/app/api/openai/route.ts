import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: Request) {
  const { apiKey, videoId } = await request.json();

  if (!apiKey) {
    return Response.json({ success: false }, {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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

  return Response.json({ text: res.text }, {
    headers: { "Content-Type": "application/json" },
  });
}
