"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonMail } from "./skeleton-mail";
import { useState } from "react";
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CopyButton } from "./copy-button";
import { toast } from "sonner";

const generateEmailOutput = (result: string, videoId: string) => {
  return `Hi,

My name is [Your Name] from [Name of Brand]. Our team has been following your social media for a while now and I'm so impressed by your ${result}
https://www.youtube.com/watch?v=${videoId ?? ""}

I'm seeking influencers to collaborate with for paid opportunities and you'd be a perfect fit based on your content. If you're interested, reply to this message and I'll share more details. Looking forward to hearing from you!

Best,`;
};

const isValidYoutubeUrl = (url: string): string | null => {
  // Regular expression to match various YouTube URL formats
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

  try {
    // Check if URL matches YouTube pattern
    if (!youtubeRegex.test(url)) {
      return null;
    }

    // Try parsing as URL to validate format
    const urlObj = new URL(url);

    // Check for valid YouTube domains
    const validDomains = [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
      "www.youtu.be",
    ];
    if (!validDomains.includes(urlObj.hostname)) {
      return null;
    }

    // Extract video ID
    if (urlObj.hostname.includes("youtu.be")) {
      // Handle youtu.be format
      return urlObj.pathname.slice(1);
    } else {
      // Handle youtube.com format
      const videoId = urlObj.searchParams.get("v");
      return videoId;
    }
  } catch {
    // If URL parsing fails, return null
    return null;
  }
};

export const ClientForm = () => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleFetchSubtitle = async () => {
    if (!url) throw new Error("YouTube video URL is necessary");

    const videoId = isValidYoutubeUrl(url);

    if (!videoId) throw new Error("invalid video URL");

    setVideoId(videoId);

    const response = await fetch("/api/fetch-yt-subtitle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId,
        apiKey,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const supaRes = await fetch("/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey,
        videoId,
      }),
    });

    const data2 = await supaRes.json();

    setResult(data2.text);
  };

  return (
    <>
      <div className="space-y-3 w-full">
        <Label htmlFor="url">YouTube Video URL</Label>
        <Input
          id="url"
          value={url ?? ""}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=ASABxNenD_U"
        />
      </div>

      <div className="space-y-3 w-full">
        <Label htmlFor="api-key">OpenAI API key</Label>
        <div className="flex items-center gap-x-3">
          <Input
            placeholder="sk-*******************"
            type="password"
            value={apiKey ?? ""}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      </div>
      <Button
        disabled={showSkeleton}
        size="lg"
        className="w-full"
        onClick={async () => {
          setVideoId(null);
          setShowSkeleton(true);
          setShowResult(false);
          try {
            await handleFetchSubtitle();
            setShowResult(true);
          } catch (err) {
            setShowResult(false);
            console.error("Error fetching subtitles:", err);
            toast.error((err as Error).message);
          } finally {
            setShowSkeleton(false);
          }
        }}
      >
        {showSkeleton && <Loader className="animate-spin size-4" />}
        Generate personalized email
      </Button>
      {showSkeleton && <SkeletonMail />}
      {showResult && (
        <>
          <CopyButton
            variant="outline"
            value={generateEmailOutput(result, videoId ?? "")}
          />
          <div className="whitespace-pre-line">
            {generateEmailOutput(result, videoId ?? "")}
          </div>
        </>
      )}
    </>
  );
};
