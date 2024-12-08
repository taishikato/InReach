"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  if (process.env.NODE_ENV === "production") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
    });
  }
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }

  return <>{children}</>;
}
