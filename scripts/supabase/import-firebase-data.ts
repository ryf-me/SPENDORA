import path from "node:path";
import process from "node:process";
import {
  chunk,
  createAdminSupabase,
  normalizeArray,
  normalizeDate,
  readAuthMapping,
  readJsonFile,
} from "./_shared";

type FirebaseRecord = Record<string, any> & { id?: string; userId?: string };

function mapUserId(mapping: Map<string, { supabaseUserId: string }>, firebaseUserId: string | undefined) {
  if (!firebaseUserId) return null;
  return mapping.get(firebaseUserId)?.supabaseUserId ?? null;
}

async function loadCollection(filePath: string) {
  const raw = await readJsonFile<unknown>(filePath);
  return normalizeArray<FirebaseRecord>(raw);
}

async function upsertInBatches(table: string, rows: Record<string, unknown>[]) {
  const admin = createAdminSupabase();
  for (const batch of chunk(rows, 250)) {
    if (batch.length === 0) continue;
    const { error } = await admin.from(table).upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }
}

async function main() {
  const exportDir = process.env.FIREBASE_EXPORT_DIR || path.join("exports", "firestore");
  const mappingPath = process.env.AUTH_MAPPING_OUTPUT_PATH || path.join("storage", "supabase-auth-map.json");
  const authMapping = await readAuthMapping(mappingPath);

  const users = await loadCollection(path.join(exportDir, "users.json"));
  const categories = await loadCollection(path.join(exportDir, "categories.json"));
  const expenses = await loadCollection(path.join(exportDir, "expenses.json"));
  const debtors = await loadCollection(path.join(exportDir, "debtors.json"));
  const payments = await loadCollection(path.join(exportDir, "payments.json"));
  const feedback = await loadCollection(path.join(exportDir, "feedback.json"));

  const profileRows = users
    .map((row) => {
      const mappedUserId = mapUserId(authMapping, row.id || row.userId);
      if (!mappedUserId) return null;

      return {
        id: mappedUserId,
        legacy_firebase_uid: row.id || row.userId,
        name: row.name || row.email?.split("@")[0] || "User",
        email: row.email || null,
        bio: row.bio || "",
        photo_url: row.photoURL || null,
        currency: row.currency || "LKR",
        notifications: row.notifications || undefined,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  const categoryRows = categories
    .map((row) => {
      const mappedUserId = mapUserId(authMapping, row.userId);
      if (!mappedUserId || !row.id) return null;
      return {
        id: String(row.id),
        user_id: mappedUserId,
        name: row.name || "Uncategorized",
        created_at: normalizeDate(row.createdAt),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  const expenseRows = expenses
    .map((row) => {
      const mappedUserId = mapUserId(authMapping, row.userId);
      if (!mappedUserId || !row.id) return null;
      return {
        id: String(row.id),
        user_id: mappedUserId,
        amount: Number(row.amount || 0),
        category: row.category || "",
        description: row.description || "",
        date: row.date,
        receipt_url: row.receiptUrl || "",
        split_with: row.splitWith || "",
        subject: row.subject || "",
        merchant: row.merchant || "",
        currency: row.currency || "LKR",
        reimbursable: Boolean(row.reimbursable),
        employee: row.employee || "",
        add_to_report: Boolean(row.addToReport),
        tags: row.tags || [],
        is_recurring: Boolean(row.isRecurring),
        frequency: row.frequency || "",
        end_date: row.endDate || null,
        recurring_status: row.recurringStatus || "active",
        recurring_notifications: row.recurringNotifications ?? true,
        icon: row.icon || "",
        payment_method: row.paymentMethod || "",
        created_at: normalizeDate(row.createdAt),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  const debtorRows = debtors
    .map((row) => {
      const mappedUserId = mapUserId(authMapping, row.userId);
      if (!mappedUserId || !row.id) return null;
      return {
        id: String(row.id),
        user_id: mappedUserId,
        debtor_name: row.debtorName || "Debtor",
        phone_number: row.phoneNumber || "",
        email: row.email || "",
        amount: Number(row.amount || 0),
        paid_amount: Number(row.paidAmount || 0),
        expense_id: row.expenseId || null,
        notes: row.notes || "",
        status: row.status || "pending",
        date: row.date,
        created_at: normalizeDate(row.createdAt),
        paid_at: normalizeDate(row.paidAt),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  const paymentRows = payments
    .map((row) => {
      const mappedUserId = mapUserId(authMapping, row.userId);
      if (!mappedUserId || !row.id) return null;
      return {
        id: String(row.id),
        debtor_id: row.debtorId,
        debtor_name: row.debtorName || "Debtor",
        amount: Number(row.amount || 0),
        date: row.date,
        method: row.method || "cash",
        user_id: mappedUserId,
        created_at: normalizeDate(row.createdAt),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  const feedbackRows = feedback
    .map((row) => {
      const mappedUserId = mapUserId(authMapping, row.userId);
      if (!mappedUserId || !row.id) return null;
      return {
        id: String(row.id),
        user_id: mappedUserId,
        name: row.name || "",
        email: row.email || "",
        message: row.message || "",
        type: row.type || "Spendora Feeds",
        created_at: normalizeDate(row.createdAt),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  await upsertInBatches("profiles", profileRows);
  await upsertInBatches("categories", categoryRows);
  await upsertInBatches("expenses", expenseRows);
  await upsertInBatches("debtors", debtorRows);
  await upsertInBatches("payments", paymentRows);
  await upsertInBatches("feedback", feedbackRows);

  console.log("Imported Firebase collection exports into Supabase.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
