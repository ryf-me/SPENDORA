import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createAdminSupabase, readAuthMapping } from "./_shared";

async function walk(dir: string, root = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(fullPath, root)));
    } else {
      results.push(path.relative(root, fullPath));
    }
  }

  return results;
}

async function main() {
  const admin = createAdminSupabase();
  const storageExportDir = process.env.FIREBASE_STORAGE_EXPORT_DIR || path.join("exports", "storage");
  const mappingPath = process.env.AUTH_MAPPING_OUTPUT_PATH || path.join("storage", "supabase-auth-map.json");
  const authMapping = await readAuthMapping(mappingPath);

  const files = (await walk(storageExportDir)).sort();
  const latestAvatarByUser = new Map<string, string>();

  for (const relativePath of files) {
    const normalized = relativePath.split(path.sep).join("/");
    let destinationPath = normalized;

    const parts = normalized.split("/");
    if (parts[0] === "avatars" && parts[1]) {
      const mapped = authMapping.get(parts[1]);
      if (!mapped) {
        console.warn(`Skipping avatar without auth mapping: ${normalized}`);
        continue;
      }
      destinationPath = ["avatars", mapped.supabaseUserId, ...parts.slice(2)].join("/");
      latestAvatarByUser.set(mapped.supabaseUserId, destinationPath);
    }

    const sourceBuffer = await fs.readFile(path.join(storageExportDir, relativePath));
    const { error } = await admin.storage.from("avatars").upload(destinationPath, sourceBuffer, {
      upsert: true,
    });

    if (error) {
      throw error;
    }
  }

  for (const [supabaseUserId, objectPath] of latestAvatarByUser.entries()) {
    const { data } = admin.storage.from("avatars").getPublicUrl(objectPath);
    const { error } = await admin.from("profiles").update({ photo_url: data.publicUrl }).eq("id", supabaseUserId);
    if (error) throw error;
  }

  console.log(`Imported ${files.length} storage objects into Supabase Storage.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
