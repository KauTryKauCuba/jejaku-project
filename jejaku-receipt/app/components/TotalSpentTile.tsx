"use client";

import { CurrencyDollar } from "@phosphor-icons/react";
import StatTile from "./StatTile";
import { formatCurrency } from "../lib/expenses";
import { useDefaultCurrency, useExpenses } from "./ExpensesProvider";

export default function TotalSpentTile() {
  const expenses = useExpenses();
  const defaultCurrency = useDefaultCurrency();
  // homeCurrencyAmount is the snapshot converted into the account's home
  // currency at save time — see the schema comment. A missing snapshot
  // (an old row, or one where the FX lookup failed) is excluded rather
  // than added in as a raw, un-converted number.
  const totalSpent = expenses.reduce((sum, e) => sum + (e.homeCurrencyAmount ?? 0), 0);

  return (
    <StatTile
      icon={CurrencyDollar}
      label="Total Spent"
      value={formatCurrency(totalSpent, defaultCurrency)}
      detail={
        expenses.length > 0
          ? "Across every expense you've logged."
          : "Across every receipt you've scanned."
      }
      seed={1}
    />
  );
}
