"use client";

import { Receipt } from "@phosphor-icons/react";
import StatTile from "./StatTile";
import { useExpenses } from "./ExpensesProvider";

export default function ReceiptsScannedTile() {
  const expenses = useExpenses();

  return (
    <StatTile
      icon={Receipt}
      label="Receipts Scanned"
      value={String(expenses.length)}
      detail={
        expenses.length > 0
          ? "Total expenses logged so far."
          : "Nothing yet — add one above."
      }
      seed={2}
    />
  );
}
