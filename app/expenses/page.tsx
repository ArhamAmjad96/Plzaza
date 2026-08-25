import { getPlazaExpenses } from "@/lib/expenses/service";
import ExpensesManager from "@/components/expenses/ExpensesManager";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const targetMonth = params.month || null;

  const { expenses, stats, selectedMonth } = await getPlazaExpenses(targetMonth);

  return (
    <div className="space-y-8">
      <ExpensesManager
        expenses={expenses}
        stats={stats}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
