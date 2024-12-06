import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return Response.json({
        success: false,
      }, { status: 400 });
    }

    const loader = YoutubeLoader.createFromUrl(`https://youtu.be/${videoId}`, {
      language: "en-US",
      // addVideoInfo: true,
    });

    const docs = await loader.load();

    console.log(docs);

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
