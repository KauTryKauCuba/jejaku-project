"use client";

import { CurrencyDollar } from "@phosphor-icons/react";
import StatTile from "./StatTile";
import { formatCurrency } from "../lib/expenses";
import { useExpenses } from "./ExpensesProvider";

export default function TotalSpentTile() {
  const expenses = useExpenses();
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <StatTile
      icon={CurrencyDollar}
      label="Total Spent"
      value={`$${formatCurrency(totalSpent)}`}
      detail={
        expenses.length > 0
          ? "Across every expense you've logged."
          : "Across every receipt you've scanned."
      }
      seed={1}
    />
  );
}
