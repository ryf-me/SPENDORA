import { getSupabaseFunctionUrl } from "../supabase";

export async function requestAiAssistant({
  accessToken,
  message,
  context,
}: {
  accessToken: string;
  message: string;
  context: unknown;
}) {
  const response = await fetch(getSupabaseFunctionUrl("ai-assistant"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message, context }),
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("The AI backend is not available or returned an invalid response.");
  }

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData?.error || "Failed to connect to AI service.");
  }

  return typeof responseData?.text === "string" ? responseData.text : "I could not generate a response.";
}
