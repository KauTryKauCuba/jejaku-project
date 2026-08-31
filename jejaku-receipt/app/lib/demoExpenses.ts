export type DemoExpense = {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  tax?: number;
  note?: string;
  location?: string;
  items?: { name: string; price: number }[];
};

// Sample receipts spread across March-August so every dashboard chart
// (Monthly Trend, Categories Tracked) has something to show. Shared between
// the "Get dummy data" Settings action and the one-time VPS seed script —
// one source of truth for what "the dummy data" actually is. Kept in its
// own file (no server-only imports) so client components can read
// DEMO_EXPENSES.length without pulling in the DB client.
export const DEMO_EXPENSES: DemoExpense[] = [
  // August
  { merchant: "Trader Joe's", amount: 42.5, currency: "USD", date: "2026-08-05", category: "Groceries", tax: 3.2, location: "123 Main St, Springfield", items: [{ name: "Bananas", price: 2.5 }, { name: "Almond milk", price: 4.0 }, { name: "Sourdough bread", price: 5.5 }] },
  { merchant: "Starbucks", amount: 18.9, currency: "MYR", date: "2026-08-07", category: "Food & Drink", tax: 1.1, location: "Pavilion KL", note: "Morning coffee with Sarah" },
  { merchant: "Grab", amount: 24.0, currency: "MYR", date: "2026-08-09", category: "Transport", note: "Airport ride" },
  { merchant: "Uniqlo", amount: 189.0, currency: "MYR", date: "2026-08-12", category: "Shopping", tax: 10.7, location: "Mid Valley Megamall", items: [{ name: "T-shirt", price: 59.9 }, { name: "Jeans", price: 129.1 }] },
  { merchant: "TNB", amount: 156.4, currency: "MYR", date: "2026-08-01", category: "Bills & Utilities", note: "Electricity bill" },
  { merchant: "Guardian Pharmacy", amount: 37.8, currency: "MYR", date: "2026-08-15", category: "Health", tax: 2.1, location: "Bangsar Village" },
  { merchant: "GSC Cinemas", amount: 32.0, currency: "MYR", date: "2026-08-18", category: "Entertainment", location: "1 Utama", note: "Movie night" },
  { merchant: "Din Tai Fung", amount: 96.5, currency: "SGD", date: "2026-08-20", category: "Food & Drink", tax: 6.75, location: "Marina Bay Sands, Singapore", note: "Business trip dinner", items: [{ name: "Xiao long bao", price: 18.9 }, { name: "Fried rice", price: 16.5 }, { name: "Iced tea x2", price: 9.0 }] },
  { merchant: "Petronas", amount: 80.0, currency: "MYR", date: "2026-08-22", category: "Transport", note: "Fuel" },
  { merchant: "IKEA", amount: 245.0, currency: "MYR", date: "2026-08-27", category: "Home & Furniture", tax: 13.9, location: "Damansara", note: "New desk lamp and shelves", items: [{ name: "Desk lamp", price: 89.0 }, { name: "Shelf unit", price: 156.0 }] },
  { merchant: "Village Grocer", amount: 79.4, currency: "MYR", date: "2026-08-03", category: "Groceries" },
  { merchant: "OldTown White Coffee", amount: 17.5, currency: "MYR", date: "2026-08-06", category: "Food & Drink", tax: 1.0 },
  { merchant: "Grab", amount: 21.0, currency: "MYR", date: "2026-08-11", category: "Transport" },
  { merchant: "Unifi", amount: 129.0, currency: "MYR", date: "2026-08-06", category: "Bills & Utilities", note: "Internet bill" },
  { merchant: "Watsons", amount: 31.6, currency: "MYR", date: "2026-08-14", category: "Health" },
  { merchant: "Zara", amount: 178.0, currency: "MYR", date: "2026-08-19", category: "Shopping", tax: 10.1 },
  { merchant: "GSC Cinemas", amount: 29.0, currency: "MYR", date: "2026-08-24", category: "Entertainment" },
  { merchant: "Nando's", amount: 52.3, currency: "MYR", date: "2026-08-28", category: "Food & Drink", tax: 3.0 },
  { merchant: "Ippudo", amount: 64.5, currency: "SGD", date: "2026-08-16", category: "Food & Drink", tax: 4.5, note: "Business trip" },
  { merchant: "Mercato", amount: 60.9, currency: "MYR", date: "2026-08-10", category: "Groceries", tax: 3.4 },
  { merchant: "Petronas", amount: 85.0, currency: "MYR", date: "2026-08-25", category: "Transport", note: "Fuel" },
  { merchant: "luckin coffee", amount: 21.2, currency: "MYR", date: "2026-08-30", category: "Food & Drink" },

  // July
  { merchant: "Village Grocer", amount: 88.9, currency: "MYR", date: "2026-07-05", category: "Groceries" },
  { merchant: "Grab", amount: 26.0, currency: "MYR", date: "2026-07-09", category: "Transport" },
  { merchant: "TNB", amount: 141.2, currency: "MYR", date: "2026-07-01", category: "Bills & Utilities", note: "Electricity bill" },
  { merchant: "Guardian Pharmacy", amount: 41.6, currency: "MYR", date: "2026-07-13", category: "Health", tax: 2.3 },
  { merchant: "Trader Joe's", amount: 38.9, currency: "USD", date: "2026-07-19", category: "Groceries", tax: 2.9, note: "Business trip" },
  { merchant: "H&M", amount: 98.0, currency: "MYR", date: "2026-07-27", category: "Shopping", tax: 5.6 },
  { merchant: "AEON", amount: 66.3, currency: "MYR", date: "2026-07-03", category: "Groceries" },
  { merchant: "Ippudo", amount: 61.2, currency: "MYR", date: "2026-07-11", category: "Food & Drink", tax: 3.5 },
  { merchant: "Touch 'n Go", amount: 40.0, currency: "MYR", date: "2026-07-15", category: "Transport", note: "Toll top-up" },
  { merchant: "TNB", amount: 144.5, currency: "MYR", date: "2026-07-02", category: "Bills & Utilities", note: "Electricity bill" },
  { merchant: "GSC Cinemas", amount: 30.0, currency: "MYR", date: "2026-07-23", category: "Entertainment" },
  { merchant: "H&M", amount: 87.0, currency: "MYR", date: "2026-07-30", category: "Shopping", tax: 4.9 },

  // June
  { merchant: "Jaya Grocer", amount: 76.8, currency: "MYR", date: "2026-06-03", category: "Groceries", tax: 4.4 },
  { merchant: "Starbucks", amount: 24.0, currency: "MYR", date: "2026-06-11", category: "Food & Drink", tax: 1.4 },
  { merchant: "Petronas", amount: 82.0, currency: "MYR", date: "2026-06-17", category: "Transport", note: "Fuel" },
  { merchant: "GSC Cinemas", amount: 36.0, currency: "MYR", date: "2026-06-20", category: "Entertainment", note: "Movie night" },
  { merchant: "Uniqlo", amount: 112.0, currency: "MYR", date: "2026-06-26", category: "Shopping", tax: 6.3 },
  { merchant: "Village Grocer", amount: 95.7, currency: "MYR", date: "2026-06-06", category: "Groceries" },
  { merchant: "Nando's", amount: 49.0, currency: "MYR", date: "2026-06-13", category: "Food & Drink", tax: 2.8 },
  { merchant: "Grab", amount: 23.0, currency: "MYR", date: "2026-06-19", category: "Transport" },
  { merchant: "Unifi", amount: 129.0, currency: "MYR", date: "2026-06-06", category: "Bills & Utilities", note: "Internet bill" },
  { merchant: "GSC Cinemas", amount: 34.0, currency: "MYR", date: "2026-06-24", category: "Entertainment" },
  { merchant: "Watsons", amount: 37.8, currency: "MYR", date: "2026-06-29", category: "Health" },

  // May
  { merchant: "Village Grocer", amount: 91.3, currency: "MYR", date: "2026-05-02", category: "Groceries" },
  { merchant: "Grab", amount: 22.5, currency: "MYR", date: "2026-05-08", category: "Transport" },
  { merchant: "TNB", amount: 148.7, currency: "MYR", date: "2026-05-01", category: "Bills & Utilities", note: "Electricity bill" },
  { merchant: "Din Tai Fung", amount: 78.2, currency: "SGD", date: "2026-05-14", category: "Food & Drink", tax: 5.5, note: "Weekend trip" },
  { merchant: "Watsons", amount: 33.4, currency: "MYR", date: "2026-05-21", category: "Health" },
  { merchant: "AEON", amount: 71.2, currency: "MYR", date: "2026-05-06", category: "Groceries" },
  { merchant: "Starbucks", amount: 19.9, currency: "MYR", date: "2026-05-12", category: "Food & Drink", tax: 1.2 },
  { merchant: "Petronas", amount: 78.0, currency: "MYR", date: "2026-05-18", category: "Transport", note: "Fuel" },
  { merchant: "TNB", amount: 151.9, currency: "MYR", date: "2026-05-01", category: "Bills & Utilities", note: "Electricity bill" },
  { merchant: "Guardian Pharmacy", amount: 26.4, currency: "MYR", date: "2026-05-24", category: "Health" },
  { merchant: "Zara", amount: 210.0, currency: "MYR", date: "2026-05-29", category: "Shopping", tax: 11.9 },

  // April
  { merchant: "Jaya Grocer", amount: 84.2, currency: "MYR", date: "2026-04-04", category: "Groceries", tax: 4.8 },
  { merchant: "Nando's", amount: 45.6, currency: "MYR", date: "2026-04-10", category: "Food & Drink", tax: 2.6, note: "Dinner with friends" },
  { merchant: "Petronas", amount: 75.0, currency: "MYR", date: "2026-04-16", category: "Transport", note: "Fuel" },
  { merchant: "Guardian Pharmacy", amount: 29.9, currency: "MYR", date: "2026-04-19", category: "Health" },
  { merchant: "H&M", amount: 156.0, currency: "MYR", date: "2026-04-25", category: "Shopping", tax: 8.9 },
  { merchant: "Mercato", amount: 102.4, currency: "MYR", date: "2026-04-02", category: "Groceries", tax: 5.8 },
  { merchant: "Ippudo", amount: 58.9, currency: "MYR", date: "2026-04-08", category: "Food & Drink", tax: 3.4, note: "Ramen with the team" },
  { merchant: "Grab", amount: 19.5, currency: "MYR", date: "2026-04-13", category: "Transport" },
  { merchant: "TM Unifi", amount: 129.0, currency: "MYR", date: "2026-04-06", category: "Bills & Utilities", note: "Internet bill" },
  { merchant: "GSC Cinemas", amount: 30.0, currency: "MYR", date: "2026-04-20", category: "Entertainment" },
  { merchant: "Sephora", amount: 145.0, currency: "MYR", date: "2026-04-28", category: "Shopping", tax: 8.2 },

  // March
  { merchant: "Village Grocer", amount: 68.4, currency: "MYR", date: "2026-03-03", category: "Groceries" },
  { merchant: "Starbucks", amount: 21.5, currency: "MYR", date: "2026-03-09", category: "Food & Drink", tax: 1.3 },
  { merchant: "Grab", amount: 18.0, currency: "MYR", date: "2026-03-14", category: "Transport" },
  { merchant: "TNB", amount: 132.1, currency: "MYR", date: "2026-03-01", category: "Bills & Utilities", note: "Electricity bill" },
  { merchant: "GSC Cinemas", amount: 28.0, currency: "MYR", date: "2026-03-22", category: "Entertainment" },
  { merchant: "AEON", amount: 54.6, currency: "MYR", date: "2026-03-05", category: "Groceries" },
  { merchant: "OldTown White Coffee", amount: 16.8, currency: "MYR", date: "2026-03-11", category: "Food & Drink", tax: 1.0 },
  { merchant: "Touch 'n Go", amount: 30.0, currency: "MYR", date: "2026-03-16", category: "Transport", note: "Toll top-up" },
  { merchant: "Unifi", amount: 129.0, currency: "MYR", date: "2026-03-06", category: "Bills & Utilities", note: "Internet bill" },
  { merchant: "MPH Bookstore", amount: 62.5, currency: "MYR", date: "2026-03-19", category: "Shopping", tax: 3.5 },
  { merchant: "GNC", amount: 88.0, currency: "MYR", date: "2026-03-25", category: "Health", tax: 5.0, note: "Vitamins" },
];
