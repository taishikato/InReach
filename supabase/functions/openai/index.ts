// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";
import process from "node:process";
import { corsHeaders } from "../_shared/cors.ts";
// import { OpenAI } from "npm:openai@4.76.0";
// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // const { apiKey } = await req.json();
  // const data = {
  //   message: `Hello ${name}!`,
  // };

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "hello" }],
    model: "gpt-3.5-turbo",
  });

  return new Response(
    JSON.stringify({ text: completion.choices[0].message.content }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );

  // return new Response(
  //   JSON.stringify(data),
  //   { headers: { "Content-Type": "application/json" } },
  // );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/openai' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
