"use client";

import { Tag } from "@phosphor-icons/react";
import StatTile from "./StatTile";
import { useExpenses } from "./ExpensesProvider";

export default function CategoriesTrackedTile() {
  const expenses = useExpenses();
  const categoryCount = new Set(expenses.map((e) => e.category)).size;

  return (
    <StatTile
      icon={Tag}
      label="Categories Tracked"
      value={String(categoryCount)}
      detail={
        categoryCount > 0
          ? "Distinct categories you've used."
          : "Categories build up as you add expenses."
      }
      seed={3}
    />
  );
}
