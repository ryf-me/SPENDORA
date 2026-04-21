import path from "node:path";
import process from "node:process";
import { createAdminSupabase, normalizeArray, readAuthMapping, readJsonFile } from "./_shared";

type FirebaseRecord = Record<string, any>;

async function getSourceArray(filePath: string) {
  const raw = await readJsonFile<unknown>(filePath);
  return normalizeArray<FirebaseRecord>(raw);
}

async function getTableCount(table: string) {
  const admin = createAdminSupabase();
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

async function sumTable(table: string, column: string) {
  const admin = createAdminSupabase();
  const { data, error } = await admin.from(table).select(column);
  if (error) throw error;
  return (data || []).reduce((sum, row) => sum + Number(row[column] || 0), 0);
}

async function countPendingDebtors() {
  const admin = createAdminSupabase();
  const { count, error } = await admin
    .from("debtors")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count || 0;
}

async function main() {
  const exportDir = process.env.FIREBASE_EXPORT_DIR || path.join("exports", "firestore");
  const mappingPath = process.env.AUTH_MAPPING_OUTPUT_PATH || path.join("storage", "supabase-auth-map.json");

  const authMapping = await readAuthMapping(mappingPath);
  const sourceUsers = await getSourceArray(path.join(exportDir, "users.json"));
  const sourceCategories = await getSourceArray(path.join(exportDir, "categories.json"));
  const sourceExpenses = await getSourceArray(path.join(exportDir, "expenses.json"));
  const sourceDebtors = await getSourceArray(path.join(exportDir, "debtors.json"));
  const sourcePayments = await getSourceArray(path.join(exportDir, "payments.json"));
  const sourceFeedback = await getSourceArray(path.join(exportDir, "feedback.json"));

  const checks = [
    { label: "Auth mappings", source: authMapping.size, destination: authMapping.size },
    { label: "Profiles", source: sourceUsers.length, destination: await getTableCount("profiles") },
    { label: "Categories", source: sourceCategories.length, destination: await getTableCount("categories") },
    { label: "Expenses", source: sourceExpenses.length, destination: await getTableCount("expenses") },
    { label: "Debtors", source: sourceDebtors.length, destination: await getTableCount("debtors") },
    { label: "Payments", source: sourcePayments.length, destination: await getTableCount("payments") },
    { label: "Feedback", source: sourceFeedback.length, destination: await getTableCount("feedback") },
  ];

  const sourceExpenseTotal = sourceExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const sourceDebtTotal = sourceDebtors.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const sourceCollectedTotal = sourceDebtors.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
  const sourcePendingDebtors = sourceDebtors.filter((row) => row.status === "pending").length;

  const destinationExpenseTotal = await sumTable("expenses", "amount");
  const destinationDebtTotal = await sumTable("debtors", "amount");
  const destinationCollectedTotal = await sumTable("debtors", "paid_amount");
  const destinationPendingDebtors = await countPendingDebtors();

  let hasMismatch = false;

  for (const check of checks) {
    const matches = check.source === check.destination;
    hasMismatch ||= !matches;
    console.log(`${matches ? "OK" : "MISMATCH"} ${check.label}: source=${check.source} destination=${check.destination}`);
  }

  const numericChecks = [
    { label: "Total expenses", source: sourceExpenseTotal, destination: destinationExpenseTotal },
    { label: "Total debt", source: sourceDebtTotal, destination: destinationDebtTotal },
    { label: "Total collected", source: sourceCollectedTotal, destination: destinationCollectedTotal },
    { label: "Pending debtors", source: sourcePendingDebtors, destination: destinationPendingDebtors },
  ];

  for (const check of numericChecks) {
    const matches = Number(check.source.toFixed(2)) === Number(check.destination.toFixed(2));
    hasMismatch ||= !matches;
    console.log(`${matches ? "OK" : "MISMATCH"} ${check.label}: source=${check.source} destination=${check.destination}`);
  }

  if (hasMismatch) {
    process.exitCode = 1;
  } else {
    console.log("Migration verification passed.");
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
