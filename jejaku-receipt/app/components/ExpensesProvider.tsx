"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { DEFAULT_CURRENCY, EXPENSE_CATEGORIES, type Expense } from "../lib/expenses";

type NewExpense = Omit<Expense, "id" | "createdAt" | "photoUrl">;

type ExpensesContextValue = {
  expenses: Expense[];
  addExpense: (input: NewExpense, photo?: File | null) => Promise<void>;
  updateExpense: (id: string, input: NewExpense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  defaultCurrency: string;
  categories: readonly string[];
  addCategory: (name: string) => Promise<void>;
};

function buildExpenseForm(input: NewExpense) {
  const form = new FormData();
  form.set("merchant", input.merchant);
  form.set("amount", String(input.amount));
  form.set("date", input.date);
  form.set("category", input.category);
  if (input.tax !== undefined) form.set("tax", String(input.tax));
  form.set("isWarrantyClaim", String(input.isWarrantyClaim === true));
  if (input.isWarrantyClaim && input.warrantyMonths) form.set("warrantyMonths", String(input.warrantyMonths));
  if (input.note) form.set("note", input.note);
  if (input.city) form.set("city", input.city);
  if (input.state) form.set("state", input.state);
  if (input.country) form.set("country", input.country);
  if (input.currency) form.set("currency", input.currency);
  if (input.items && input.items.length > 0) form.set("items", JSON.stringify(input.items));
  if (input.split && input.split.people.length > 0) form.set("split", JSON.stringify(input.split));
  return form;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({
  initialExpenses,
  defaultCurrency = DEFAULT_CURRENCY,
  initialCustomCategories = [],
  children,
}: {
  initialExpenses: Expense[];
  defaultCurrency?: string;
  initialCustomCategories?: string[];
  children: ReactNode;
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [customCategories, setCustomCategories] = useState(initialCustomCategories);

  const addCategory = useCallback(async (name: string) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Couldn't add category.");
    }
    const { customCategories: updated }: { customCategories: string[] } = await res.json();
    setCustomCategories(updated);
  }, []);

  const addExpense = useCallback(async (input: NewExpense, photo?: File | null) => {
    const form = buildExpenseForm(input);
    if (photo) form.set("photo", photo);

    const res = await fetch("/api/expenses", { method: "POST", body: form });
    if (!res.ok) throw new Error("Couldn't save expense.");
    const created: Expense = await res.json();
    setExpenses((prev) => [created, ...prev]);
  }, []);

  const updateExpense = useCallback(async (id: string, input: NewExpense) => {
    const form = buildExpenseForm(input);
    const res = await fetch(`/api/expenses/${id}`, { method: "PATCH", body: form });
    if (!res.ok) throw new Error("Couldn't save changes.");
    const updated: Expense = await res.json();
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Couldn't delete expense.");
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const categories = [...EXPENSE_CATEGORIES, ...customCategories];

  return (
    <ExpensesContext.Provider
      value={{ expenses, addExpense, updateExpense, deleteExpense, defaultCurrency, categories, addCategory }}
    >
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

// Unlike every other hook here, this one doesn't throw outside a provider —
// DashboardShell (which renders WarrantyBell) is also used by the Settings
// page, which has no ExpensesProvider around it. `null` lets the bell just
// render nothing there instead of crashing the whole shell.
export function useExpensesOptional(): Expense[] | null {
  return useContext(ExpensesContext)?.expenses ?? null;
}

export function useAddExpense() {
  return useExpensesContext().addExpense;
}

export function useUpdateExpense() {
  return useExpensesContext().updateExpense;
}

export function useDeleteExpense() {
  return useExpensesContext().deleteExpense;
}

export function useDefaultCurrency(): string {
  return useExpensesContext().defaultCurrency;
}

export function useCategories(): readonly string[] {
  return useExpensesContext().categories;
}

export function useAddCategory() {
  return useExpensesContext().addCategory;
}
