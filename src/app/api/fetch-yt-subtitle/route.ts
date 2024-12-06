import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

export async function POST(request: Request) {
  const loader = YoutubeLoader.createFromUrl("https://youtu.be/bZQun8Y4L2A", {
    language: "en-US",
    // addVideoInfo: true,
  });

  const docs = await loader.load();

  console.log(docs);

  return Response.json({ success: true });
}
