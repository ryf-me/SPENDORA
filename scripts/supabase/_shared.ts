import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

export type AuthMapping = {
  firebaseUid: string;
  supabaseUserId: string;
  email: string | null;
  requiresPasswordReset: boolean;
};

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(filePath: string) {
  if (!fsSync.existsSync(filePath)) return;

  const contents = fsSync.readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnvFiles() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env"));
  loadEnvFile(path.join(cwd, ".env.local"));
}

loadLocalEnvFiles();

export function requireEnv(name: string, fallbacks: string[] = []) {
  const value = [name, ...fallbacks].map((key) => process.env[key]).find(Boolean);
  if (!value) {
    const fallbackLabel = fallbacks.length ? ` (or ${fallbacks.join(", ")})` : "";
    throw new Error(`Missing required environment variable: ${name}${fallbackLabel}`);
  }
  return value;
}

export function createAdminSupabase() {
  const url = requireEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]);
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createDatabaseClient() {
  return new Client({
    connectionString: requireEnv("SUPABASE_DB_URL"),
    ssl: { rejectUnauthorized: false },
  });
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

export function normalizeArray<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object") {
    if (Array.isArray((input as { documents?: unknown[] }).documents)) {
      return (input as { documents: T[] }).documents;
    }

    if (Array.isArray((input as { users?: unknown[] }).users)) {
      return (input as { users: T[] }).users;
    }
  }

  throw new Error("Expected a JSON array or an object with a documents/users array.");
}

export function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export function normalizeDate(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function randomPassword() {
  return `Spendora!${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export async function readAuthMapping(mappingPath: string) {
  const entries = await readJsonFile<AuthMapping[]>(mappingPath);
  return new Map(entries.map((entry) => [entry.firebaseUid, entry]));
}
