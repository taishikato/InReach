import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const maxDuration = 120;

const supabase = createClient<Database>(
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

    const { count, error } = await supabase.from("influencer_vectors")
      .select("*", { count: "exact", head: true })
      .eq("metadata->>source", videoId);

    if (error) {
      console.error(error);

      throw new Error(error.message);
    }

    if ((count as number) > 0) {
      console.log("skip embedding...");
      return Response.json({ success: true });
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

    const texts = await textSplitter.splitDocuments(docs);

    await SupabaseVectorStore.fromDocuments(texts, embeddings, {
      client: supabase,
      tableName: "influencer_vectors",
      queryName: "match_influencer_vectors",
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);

    return Response.json({
      success: false,
      message: (err as Error).message,
    }, {
      status: 500,
    });
  }
}
