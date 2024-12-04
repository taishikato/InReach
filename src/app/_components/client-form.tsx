"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonMail } from "./skeleton-mail";
import { useState } from "react";
import { Loader } from "lucide-react";

export const ClientForm = () => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showResult, setShowResult] = useState(false);

  return (
    <>
      <Input placeholder="The URL of the YouTube channel" />
      <Button
        disabled={showSkeleton}
        size="lg"
        className="w-full"
        onClick={async () => {
          setShowSkeleton(true);
          setShowResult(false);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          setShowSkeleton(false);
          setShowResult(true);
        }}
      >
        {showSkeleton && <Loader className="animate-spin size-4" />}
        Generate personalized email
      </Button>
      {showSkeleton && <SkeletonMail />}
      {showResult && (
        <div>
          Hi, My name is [Your Name] from [Name of Brand]. Our team has been
          following your social media for a while now and I’m so impressed by
          your [personalized compliments about their content with a specific
          example.] I’m seeking influencers to collaborate with for paid
          opportunities and you’d be a perfect fit based on your content. If
          you’re interested, reply to this message and I’ll share more details.
          Looking forward to hearing from you! Best,
        </div>
      )}
    </>
  );
};
