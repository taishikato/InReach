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

export const ClientForm = () => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleFetchSubtitle = async () => {
    try {
      const response = await fetch("/api/fetch-yt-subtitle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: "29p8kIqyU_Y",
        }),
      });

      const data = await response.json();

      const supaRes = await fetch(
        "https://yxpetxiurawcbgseobbv.supabase.co/functions/v1/openai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data2 = await supaRes.json();
    } catch (error) {
      console.error("Error fetching subtitles:", error);
    }
  };

  return (
    <>
      <div className="space-y-3 w-full">
        <Label htmlFor="url">YouTube Channel URL</Label>
        <Input id="url" placeholder="The URL of the YouTube channel" />
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
          <Input placeholder="sk-*******************" type="password" />
        </div>
      </div>
      <Button
        disabled={showSkeleton}
        size="lg"
        className="w-full"
        onClick={async () => {
          setShowSkeleton(true);
          setShowResult(false);
          // await new Promise((resolve) => setTimeout(resolve, 3000));
          await handleFetchSubtitle();
          setShowSkeleton(false);
          setShowResult(true);
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
          <div>
            Hi, My name is [Your Name] from [Name of Brand]. Our team has been
            following your social media for a while now and I’m so impressed by
            your [personalized compliments about their content with a specific
            example.] I’m seeking influencers to collaborate with for paid
            opportunities and you’d be a perfect fit based on your content. If
            you’re interested, reply to this message and I’ll share more
            details. Looking forward to hearing from you! Best,
          </div>
        </>
      )}
    </>
  );
};
