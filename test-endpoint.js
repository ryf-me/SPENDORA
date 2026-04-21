async function test() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl || !accessToken) {
    throw new Error("Set SUPABASE_URL and SUPABASE_ACCESS_TOKEN before running this script.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: "Summarize this test request in one sentence.",
      context: {
        expenseSummary: {
          totalExpense: 12000,
          expenseCount: 8,
          categoryTotals: { Travel: 5000, Meals: 7000 },
        },
        debtorSummary: {
          debtorCount: 2,
          totalDebt: 9000,
          totalCollected: 2500,
          pendingCount: 1,
          remainingBalance: 6500,
        },
        preferredCurrency: "LKR",
      },
    }),
  });

  console.log("Status:", response.status);
  console.log("Response:", await response.text());
}

test().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
