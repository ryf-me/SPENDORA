// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_CONTEXT_BYTES = 4 * 1024;
const MAX_CATEGORY_COUNT = 20;
const MAX_CATEGORY_NAME_LENGTH = 40;
const MAX_FINANCIAL_VALUE = 1_000_000_000;
const MAX_COUNT_VALUE = 100_000;
const OPENROUTER_TIMEOUT_MS = 15_000;
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const ALLOWED_CURRENCIES = new Set(["LKR", "USD", "EUR", "GBP"]);
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SafeContext = {
  preferredCurrency: string;
  expenseSummary: {
    totalExpense: number;
    expenseCount: number;
    categoryTotals: Record<string, number>;
  };
  debtorSummary: {
    debtorCount: number;
    totalDebt: number;
    totalCollected: number;
    pendingCount: number;
    remainingBalance: number;
  };
};

const encoder = new TextEncoder();

function byteLength(value: string) {
  return encoder.encode(value).byteLength;
}

function json(data: unknown, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(JSON_HEADERS);
  headers.set("Cache-Control", "no-store");

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  return new Response(JSON.stringify(data), { status, headers });
}

function getContentLength(request: Request) {
  const parsedLength = Number.parseInt(request.headers.get("content-length") || "", 10);
  return Number.isFinite(parsedLength) ? parsedLength : 0;
}

function clampNumber(value: unknown, { min = 0, max = MAX_FINANCIAL_VALUE, integer = false } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return min;
  }

  const normalized = Math.min(max, Math.max(min, parsed));
  return integer ? Math.trunc(normalized) : normalized;
}

function sanitizeLabel(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim().slice(0, MAX_CATEGORY_NAME_LENGTH);
  return normalized || null;
}

function sanitizeCategoryTotals(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const safeEntries = Object.entries(input)
    .map(([key, value]) => [sanitizeLabel(key), clampNumber(value)] as const)
    .filter(([key]) => Boolean(key))
    .slice(0, MAX_CATEGORY_COUNT);

  return Object.fromEntries(safeEntries);
}

function sanitizeCurrency(value: unknown) {
  if (typeof value !== "string") {
    return "LKR";
  }

  const normalized = value.trim().toUpperCase();
  return ALLOWED_CURRENCIES.has(normalized) ? normalized : "LKR";
}

function formatCurrencyValue(amount: number, currency: string) {
  if (currency === "LKR") {
    return `Rs. ${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  try {
    return Number(amount || 0).toLocaleString(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

function buildFormattedSummary(context: SafeContext) {
  const categoryLines = Object.entries(context.expenseSummary.categoryTotals).map(
    ([category, total]) => `${category}: ${formatCurrencyValue(total, context.preferredCurrency)}`,
  );

  return [
    `Preferred currency: ${context.preferredCurrency}`,
    `Total expenses: ${formatCurrencyValue(context.expenseSummary.totalExpense, context.preferredCurrency)}`,
    `Expense count: ${context.expenseSummary.expenseCount}`,
    ...(categoryLines.length > 0 ? ["Expense categories:", ...categoryLines] : []),
    `Total debt: ${formatCurrencyValue(context.debtorSummary.totalDebt, context.preferredCurrency)}`,
    `Total collected: ${formatCurrencyValue(context.debtorSummary.totalCollected, context.preferredCurrency)}`,
    `Remaining balance: ${formatCurrencyValue(context.debtorSummary.remainingBalance, context.preferredCurrency)}`,
    `Pending debtors: ${context.debtorSummary.pendingCount}`,
  ].join("\n");
}

function sanitizeContext(input: unknown): SafeContext {
  const context = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const expenseSummary =
    "expenseSummary" in context &&
    context.expenseSummary &&
    typeof context.expenseSummary === "object" &&
    !Array.isArray(context.expenseSummary)
      ? context.expenseSummary
      : {};
  const debtorSummary =
    "debtorSummary" in context &&
    context.debtorSummary &&
    typeof context.debtorSummary === "object" &&
    !Array.isArray(context.debtorSummary)
      ? context.debtorSummary
      : {};

  const safeContext: SafeContext = {
    preferredCurrency: sanitizeCurrency("preferredCurrency" in context ? context.preferredCurrency : undefined),
    expenseSummary: {
      totalExpense: clampNumber("totalExpense" in expenseSummary ? expenseSummary.totalExpense : undefined),
      expenseCount: clampNumber("expenseCount" in expenseSummary ? expenseSummary.expenseCount : undefined, {
        max: MAX_COUNT_VALUE,
        integer: true,
      }),
      categoryTotals: sanitizeCategoryTotals(
        "categoryTotals" in expenseSummary ? expenseSummary.categoryTotals : undefined,
      ),
    },
    debtorSummary: {
      debtorCount: clampNumber("debtorCount" in debtorSummary ? debtorSummary.debtorCount : undefined, {
        max: MAX_COUNT_VALUE,
        integer: true,
      }),
      totalDebt: clampNumber("totalDebt" in debtorSummary ? debtorSummary.totalDebt : undefined),
      totalCollected: clampNumber("totalCollected" in debtorSummary ? debtorSummary.totalCollected : undefined),
      pendingCount: clampNumber("pendingCount" in debtorSummary ? debtorSummary.pendingCount : undefined, {
        max: MAX_COUNT_VALUE,
        integer: true,
      }),
      remainingBalance: clampNumber(
        "remainingBalance" in debtorSummary ? debtorSummary.remainingBalance : undefined,
      ),
    },
  };

  while (
    byteLength(JSON.stringify(safeContext)) > MAX_CONTEXT_BYTES &&
    Object.keys(safeContext.expenseSummary.categoryTotals).length > 0
  ) {
    const [lastKey] = Object.keys(safeContext.expenseSummary.categoryTotals).slice(-1);
    if (!lastKey) break;
    delete safeContext.expenseSummary.categoryTotals[lastKey];
  }

  return safeContext;
}

async function parseRequestBody(request: Request) {
  const rawBody = await request.text();

  if (rawBody && byteLength(rawBody) > MAX_BODY_BYTES) {
    return { error: "Request body is too large" as const };
  }

  if (!rawBody.trim()) {
    return { value: {} as Record<string, unknown> };
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Invalid JSON body" as const };
    }

    return { value: parsed as Record<string, unknown> };
  } catch {
    return { error: "Invalid JSON body" as const };
  }
}

function getBodySize(body: unknown) {
  try {
    return byteLength(JSON.stringify(body || {}));
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

function parseMessage(value: unknown) {
  if (typeof value !== "string") {
    return { error: "Invalid message" as const };
  }

  const normalized = value.replace(/\0/g, "").trim();
  if (!normalized) {
    return { error: "Invalid message" as const };
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    return { error: "Message is too long" as const };
  }

  return { value: normalized };
}

async function parseUpstreamError(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
  }

  if (getContentLength(request) > MAX_BODY_BYTES) {
    return json({ error: "Request body is too large" }, 413);
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing authentication token" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !openRouterApiKey) {
    return json({ error: "Function environment is not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return json({ error: "Invalid authentication token" }, 401);
  }

  const parsedBody = await parseRequestBody(request);
  if ("error" in parsedBody) {
    return json({ error: parsedBody.error }, parsedBody.error === "Request body is too large" ? 413 : 400);
  }

  if (getBodySize(parsedBody.value) > MAX_BODY_BYTES) {
    return json({ error: "Request body is too large" }, 413);
  }

  const parsedMessage = parseMessage(parsedBody.value.message);
  if ("error" in parsedMessage) {
    return json({ error: parsedMessage.error }, 400);
  }

  const safeContext = sanitizeContext(parsedBody.value.context);
  const formattedSummary = buildFormattedSummary(safeContext);
  const prompt = `You are SPENDORA's financial assistant.
Use only the structured summary below and do not request personally identifying information.
Keep responses concise, practical, and privacy-aware.
Use plain text only. Do not use markdown syntax such as **, __, #, bullet markers, or numbered list markers.
When referring to money, always format every amount in the user's preferred currency: ${safeContext.preferredCurrency}.
Do not return raw bare numbers for money.

Structured Summary:
${JSON.stringify(safeContext, null, 2)}

Formatted Monetary Summary:
${formattedSummary}

User Question:
${parsedMessage.value}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": request.headers.get("origin") || supabaseUrl,
        "X-Title": "Spendora",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await parseUpstreamError(response);
      console.error("OpenRouter error:", {
        status: response.status,
        error: errorData,
        userId: user.id,
      });
      return json({ error: "AI provider request failed" }, 502);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const aiResponse =
      typeof data.choices?.[0]?.message?.content === "string"
        ? data.choices[0].message.content.slice(0, 4000)
        : "I could not generate a response.";

    return json({ text: aiResponse });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return json({ error: "AI request timed out" }, 504);
    }

    console.error("AI API error:", error);
    return json({ error: "Failed to process AI request" }, 500);
  } finally {
    clearTimeout(timeoutId);
  }
});
