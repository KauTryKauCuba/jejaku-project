"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Expense } from "../lib/expenses";

type NewExpense = Omit<Expense, "id" | "createdAt" | "photoUrl">;

type ExpensesContextValue = {
  expenses: Expense[];
  addExpense: (input: NewExpense, photo?: File | null) => Promise<void>;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({
  initialExpenses,
  children,
}: {
  initialExpenses: Expense[];
  children: ReactNode;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);

  const addExpense = useCallback(async (input: NewExpense, photo?: File | null) => {
    const form = new FormData();
    form.set("merchant", input.merchant);
    form.set("amount", String(input.amount));
    form.set("date", input.date);
    form.set("category", input.category);
    if (input.note) form.set("note", input.note);
    if (photo) form.set("photo", photo);

    const res = await fetch("/api/expenses", { method: "POST", body: form });
    if (!res.ok) throw new Error("Couldn't save expense.");
    const created: Expense = await res.json();
    setExpenses((prev) => [created, ...prev]);
  }, []);

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
}

function useExpensesContext() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpensesProvider");
  return ctx;
}

export function useExpenses(): Expense[] {
  return useExpensesContext().expenses;
}

export function useAddExpense() {
  return useExpensesContext().addExpense;
}
