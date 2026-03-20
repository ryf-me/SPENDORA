import { GoogleGenAI } from "@google/genai";

const MAX_MESSAGE_LENGTH = 1000;

async function verifyFirebaseIdToken(idToken) {
  const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!firebaseApiKey) {
    throw new Error("Server Firebase API key is not configured");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!Array.isArray(data.users) || data.users.length === 0) {
    return null;
  }

  return data.users[0];
}

function getAuthToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (!origin || !host) return true;

  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host === host;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  const authToken = getAuthToken(req);
  if (!authToken) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  const verifiedUser = await verifyFirebaseIdToken(authToken);
  if (!verifiedUser) {
    return res.status(401).json({ error: "Invalid authentication token" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server AI key is not configured" });
  }

  const { message, context } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Invalid message" });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message is too long" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are SPENDORA's financial assistant.
Use only the structured summary below and do not request personally identifying information.
Keep responses concise, practical, and privacy-aware.

Structured Summary:
${JSON.stringify(context || {}, null, 2)}

User Question:
${message.trim()}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return res.status(200).json({
      text: response.text || "I could not generate a response.",
    });
  } catch (error) {
    console.error("AI API error:", error);
    return res.status(500).json({ error: "Failed to process AI request" });
  }
}
