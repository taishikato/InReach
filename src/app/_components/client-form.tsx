"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonMail } from "./skeleton-mail";
import { useState } from "react";
import { Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { CopyButton } from "./copy-button";
import { toast } from "sonner";

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

  const handleFetchSubtitle = async () => {
    if (!url) throw new Error("YouTube video URL is necessary");

    const videoId = isValidYoutubeUrl(url);

    if (!videoId) throw new Error("invalid video URL");

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
      throw new Error("error");
    }

    const supaRes = await fetch(
      "https://yxpetxiurawcbgseobbv.supabase.co/functions/v1/openai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          videoId,
        }),
      }
    );

    const data2 = await supaRes.json();

    setResult(data2.text);
  };

  return (
    <>
      <div className="space-y-3 w-full">
        <Label htmlFor="url">YouTube Channel URL</Label>
        <Input
          id="url"
          value={url ?? ""}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="The URL of the YouTube channel"
        />
      </div>

      <div className="space-y-3 w-full">
        <Label htmlFor="api-key">OpenAI API key</Label>
        <div className="flex items-center gap-x-3">
          {/* <Select>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Select an AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>AI provider</SelectLabel>
                <SelectItem value="apple">OpenAI</SelectItem>
                <SelectItem value="banana">Anthropic</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select> */}
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
            value="Hi, My name is [Your Name] from [Name of Brand]. Our team has been
            following your social media for a while now and I’m so impressed by
            your [personalized compliments about their content with a specific
            example.] I’m seeking influencers to collaborate with for paid
            opportunities and you’d be a perfect fit based on your content. If
            you’re interested, reply to this message and I’ll share more
            details. Looking forward to hearing from you! Best,"
          />
          <div className="whitespace-pre-line">
            {`Hi,

My name is [Your Name] from [Name of Brand]. Our team has been following your social media for a while now and I'm so impressed by your ${result}

I'm seeking influencers to collaborate with for paid opportunities and you'd be a perfect fit based on your content. If you're interested, reply to this message and I'll share more details. Looking forward to hearing from you!

Best,`}
          </div>
        </>
      )}
    </>
  );
};
