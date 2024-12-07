import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 100,
});

export async function POST(request: Request) {
  try {
    const { videoId, apiKey } = await request.json();

    if (!videoId || !apiKey) {
      return Response.json({
        success: false,
      }, { status: 400 });
    }

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey,
    });

    const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
      // language: "en-US",
      // addVideoInfo: true,
    });

    const docs = await loader.load();
    console.log(docs);

    const texts = await textSplitter.splitDocuments(docs);

    await SupabaseVectorStore.fromDocuments(texts, embeddings, {
      client: supabaseClient,
      tableName: "influencer_vectors",
      queryName: "match_influencer_vectors",
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({
      success: false,
      message: (err as Error).message,
    }, {
      status: 500,
    });
  }
}
