import path from "node:path";
import process from "node:process";
import { createAdminSupabase, createDatabaseClient, normalizeArray, randomPassword, readJsonFile, writeJsonFile } from "./_shared";

type FirebaseAuthUser = {
  localId?: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  disabled?: boolean;
  emailVerified?: boolean;
};

async function main() {
  const admin = createAdminSupabase();
  const db = createDatabaseClient();
  const authExportPath = process.env.FIREBASE_AUTH_EXPORT_PATH || path.join("exports", "firebase-auth-users.json");
  const authMappingOutput = process.env.AUTH_MAPPING_OUTPUT_PATH || path.join("storage", "supabase-auth-map.json");

  const rawUsers = await readJsonFile<unknown>(authExportPath);
  const users = normalizeArray<FirebaseAuthUser>(rawUsers);

  await db.connect();

  const mappings = [];

  for (const user of users) {
    if (!user.localId || !user.email) {
      console.warn("Skipping auth user without a uid/email:", user);
      continue;
    }

    const existing = await db.query<{ id: string }>("select id from auth.users where email = $1 limit 1", [user.email]);
    let supabaseUserId = existing.rows[0]?.id;

    if (!supabaseUserId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        email_confirm: user.emailVerified ?? true,
        user_metadata: {
          full_name: user.displayName || user.email.split("@")[0],
          display_name: user.displayName || user.email.split("@")[0],
          avatar_url: user.photoUrl || null,
          legacy_firebase_uid: user.localId,
        },
        password: randomPassword(),
        ban_duration: user.disabled ? "876000h" : undefined,
      });

      if (error || !data.user) {
        throw error || new Error(`Failed to create Supabase auth user for ${user.email}`);
      }

      supabaseUserId = data.user.id;
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: supabaseUserId,
      legacy_firebase_uid: user.localId,
      name: user.displayName || user.email.split("@")[0],
      email: user.email,
      photo_url: user.photoUrl || null,
    });

    if (profileError) {
      throw profileError;
    }

    mappings.push({
      firebaseUid: user.localId,
      supabaseUserId,
      email: user.email,
      requiresPasswordReset: true,
    });
  }

  await writeJsonFile(authMappingOutput, mappings);
  await db.end();

  console.log(`Imported ${mappings.length} auth users.`);
  console.log(`Wrote auth mapping to ${authMappingOutput}.`);
  console.log("Note: migrated email/password users are flagged for password reset unless you supply your own password import flow.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
