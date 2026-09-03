export type DemoExpense = {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  tax?: number;
  note?: string;
  city?: string;
  state?: string;
  country?: string;
  items?: { name: string; price: number; quantity?: number }[];
};

// Sample receipts spread across March-August so every dashboard chart
// (Monthly Trend, Categories Tracked) has something to show. Shared between
// the "Get dummy data" Settings action and the one-time VPS seed script —
// one source of truth for what "the dummy data" actually is. Kept in its
// own file (no server-only imports) so client components can read
// DEMO_EXPENSES.length without pulling in the DB client.
//
// Every entry's items sum to exactly (amount - tax), like a real itemized
// receipt. Every entry also has a city/country — a fictional user based in
// Kuala Lumpur, with recurring merchants (groceries, transport, home bills)
// always resolving to the same branch/city rather than jumping around, plus
// a couple of real trips abroad (Singapore, a US business trip) that show
// up as their own pins on the location map.
export const DEMO_EXPENSES: DemoExpense[] = [
  // August
  { merchant: "Trader Joe's", amount: 42.5, currency: "USD", date: "2026-08-05", category: "Groceries", tax: 3.2, city: "Springfield", state: "IL", country: "United States", items: [{ name: "Bananas", price: 2.5 }, { name: "Almond milk", price: 4 }, { name: "Sourdough bread", price: 5.5 }, { name: "Chicken breast", price: 13.65 }, { name: "Pasta", price: 13.65 }] },
  { merchant: "Starbucks", amount: 18.9, currency: "MYR", date: "2026-08-07", category: "Food & Drink", tax: 1.1, city: "Kuala Lumpur", country: "Malaysia", note: "Morning coffee with Sarah", items: [{ name: "Caffe Latte", price: 11.03 }, { name: "Butter Croissant", price: 6.77 }] },
  { merchant: "Grab", amount: 24, currency: "MYR", date: "2026-08-09", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Airport ride", items: [{ name: "Ride fare", price: 24 }] },
  { merchant: "Uniqlo", amount: 189, currency: "MYR", date: "2026-08-12", category: "Shopping", tax: 10.7, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "T-shirt", price: 56.51 }, { name: "Jeans", price: 121.79 }] },
  { merchant: "TNB", amount: 156.4, currency: "MYR", date: "2026-08-01", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Electricity bill", items: [{ name: "Electricity usage", price: 156.4 }] },
  { merchant: "Guardian Pharmacy", amount: 37.8, currency: "MYR", date: "2026-08-15", category: "Health", tax: 2.1, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Vitamin C tablets", price: 22.9 }, { name: "Hand sanitizer", price: 12.8 }] },
  { merchant: "GSC Cinemas", amount: 32, currency: "MYR", date: "2026-08-18", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", note: "Movie night", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Popcorn combo", price: 6 }] },
  { merchant: "Din Tai Fung", amount: 96.5, currency: "SGD", date: "2026-08-20", category: "Food & Drink", tax: 6.75, city: "Singapore", country: "Singapore", note: "Business trip dinner", items: [{ name: "Xiao long bao", price: 18.9 }, { name: "Fried rice", price: 16.5 }, { name: "Iced tea", price: 4.5, quantity: 2 }, { name: "Pork dumplings", price: 22.68 }, { name: "Wontons in chili oil", price: 22.67 }] },
  { merchant: "Petronas", amount: 80, currency: "MYR", date: "2026-08-22", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Fuel", items: [{ name: "RON95 fuel", price: 80 }] },
  { merchant: "IKEA", amount: 245, currency: "MYR", date: "2026-08-27", category: "Home & Furniture", tax: 13.9, city: "Petaling Jaya", state: "Selangor", country: "Malaysia", note: "New desk lamp and shelves", items: [{ name: "Desk lamp", price: 83.95 }, { name: "Shelf unit", price: 147.15 }] },
  { merchant: "Village Grocer", amount: 79.4, currency: "MYR", date: "2026-08-03", category: "Groceries", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Fresh produce", price: 34.5 }, { name: "Dairy & eggs", price: 22.9 }, { name: "Snacks", price: 22 }] },
  { merchant: "OldTown White Coffee", amount: 17.5, currency: "MYR", date: "2026-08-06", category: "Food & Drink", tax: 1, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Kopi O", price: 6.13 }, { name: "Kaya toast set", price: 10.37 }] },
  { merchant: "Grab", amount: 21, currency: "MYR", date: "2026-08-11", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Ride fare", price: 21 }] },
  { merchant: "Unifi", amount: 129, currency: "MYR", date: "2026-08-06", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Internet bill", items: [{ name: "Internet subscription", price: 129 }] },
  { merchant: "Watsons", amount: 31.6, currency: "MYR", date: "2026-08-14", category: "Health", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Shampoo", price: 18.9 }, { name: "Vitamin C", price: 12.7 }] },
  { merchant: "Zara", amount: 178, currency: "MYR", date: "2026-08-19", category: "Shopping", tax: 10.1, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Jacket", price: 121.68 }, { name: "Belt", price: 46.22 }] },
  { merchant: "GSC Cinemas", amount: 29, currency: "MYR", date: "2026-08-24", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Soda", price: 3 }] },
  { merchant: "Nando's", amount: 52.3, currency: "MYR", date: "2026-08-28", category: "Food & Drink", tax: 3, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Half chicken", price: 36.4 }, { name: "Peri-peri chips", price: 12.9 }] },
  { merchant: "Ippudo", amount: 64.5, currency: "SGD", date: "2026-08-16", category: "Food & Drink", tax: 4.5, city: "Singapore", country: "Singapore", note: "Business trip", items: [{ name: "Akamaru ramen", price: 22.9 }, { name: "Gyoza", price: 12.9 }, { name: "Char siu rice", price: 24.2 }] },
  { merchant: "Mercato", amount: 60.9, currency: "MYR", date: "2026-08-10", category: "Groceries", tax: 3.4, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Groceries", price: 57.5 }] },
  { merchant: "Petronas", amount: 85, currency: "MYR", date: "2026-08-25", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Fuel", items: [{ name: "RON95 fuel", price: 85 }] },
  { merchant: "luckin coffee", amount: 21.2, currency: "MYR", date: "2026-08-30", category: "Food & Drink", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Coconut latte", price: 21.2 }] },

  // July
  { merchant: "Village Grocer", amount: 88.9, currency: "MYR", date: "2026-07-05", category: "Groceries", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Fresh produce", price: 38.9 }, { name: "Dairy & eggs", price: 25 }, { name: "Snacks", price: 25 }] },
  { merchant: "Grab", amount: 26, currency: "MYR", date: "2026-07-09", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Ride fare", price: 26 }] },
  { merchant: "TNB", amount: 141.2, currency: "MYR", date: "2026-07-01", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Electricity bill", items: [{ name: "Electricity usage", price: 141.2 }] },
  { merchant: "Guardian Pharmacy", amount: 41.6, currency: "MYR", date: "2026-07-13", category: "Health", tax: 2.3, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Multivitamins", price: 27.3 }, { name: "Cough syrup", price: 12 }] },
  { merchant: "Trader Joe's", amount: 38.9, currency: "USD", date: "2026-07-19", category: "Groceries", tax: 2.9, city: "Springfield", state: "IL", country: "United States", note: "Business trip", items: [{ name: "Eggs", price: 5 }, { name: "Greek yogurt", price: 6.5 }, { name: "Orange juice", price: 4 }, { name: "Olive oil", price: 20.5 }] },
  { merchant: "H&M", amount: 98, currency: "MYR", date: "2026-07-27", category: "Shopping", tax: 5.6, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "T-shirt", price: 27.82, quantity: 2 }, { name: "Cap", price: 36.76 }] },
  { merchant: "AEON", amount: 66.3, currency: "MYR", date: "2026-07-03", category: "Groceries", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Groceries", price: 48.3 }, { name: "Household items", price: 18 }] },
  { merchant: "Ippudo", amount: 61.2, currency: "MYR", date: "2026-07-11", category: "Food & Drink", tax: 3.5, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Tonkotsu ramen", price: 28.9 }, { name: "Gyoza", price: 14.9 }, { name: "Karaage chicken", price: 13.9 }] },
  { merchant: "Touch 'n Go", amount: 40, currency: "MYR", date: "2026-07-15", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Toll top-up", items: [{ name: "Toll reload", price: 40 }] },
  { merchant: "TNB", amount: 144.5, currency: "MYR", date: "2026-07-02", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Electricity bill", items: [{ name: "Electricity usage", price: 144.5 }] },
  { merchant: "GSC Cinemas", amount: 30, currency: "MYR", date: "2026-07-23", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Soda", price: 4 }] },
  { merchant: "H&M", amount: 87, currency: "MYR", date: "2026-07-30", category: "Shopping", tax: 4.9, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Jeans", price: 65.12 }, { name: "Socks", price: 5.66, quantity: 3 }] },

  // June
  { merchant: "Jaya Grocer", amount: 76.8, currency: "MYR", date: "2026-06-03", category: "Groceries", tax: 4.4, city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Fresh produce", price: 39.41 }, { name: "Pantry items", price: 32.99 }] },
  { merchant: "Starbucks", amount: 24, currency: "MYR", date: "2026-06-11", category: "Food & Drink", tax: 1.4, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Caffe Latte", price: 15.54 }, { name: "Blueberry muffin", price: 7.06 }] },
  { merchant: "Petronas", amount: 82, currency: "MYR", date: "2026-06-17", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Fuel", items: [{ name: "RON95 fuel", price: 82 }] },
  { merchant: "GSC Cinemas", amount: 36, currency: "MYR", date: "2026-06-20", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", note: "Movie night", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Popcorn combo", price: 10 }] },
  { merchant: "Uniqlo", amount: 112, currency: "MYR", date: "2026-06-26", category: "Shopping", tax: 6.3, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Hoodie", price: 85.81 }, { name: "Socks", price: 6.63, quantity: 3 }] },
  { merchant: "Village Grocer", amount: 95.7, currency: "MYR", date: "2026-06-06", category: "Groceries", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Fresh produce", price: 42.7 }, { name: "Dairy & eggs", price: 28 }, { name: "Snacks", price: 25 }] },
  { merchant: "Nando's", amount: 49, currency: "MYR", date: "2026-06-13", category: "Food & Drink", tax: 2.8, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Quarter chicken", price: 24.9 }, { name: "Peri-peri chips", price: 12.9 }, { name: "Garlic bread", price: 8.4 }] },
  { merchant: "Grab", amount: 23, currency: "MYR", date: "2026-06-19", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Ride fare", price: 23 }] },
  { merchant: "Unifi", amount: 129, currency: "MYR", date: "2026-06-06", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Internet bill", items: [{ name: "Internet subscription", price: 129 }] },
  { merchant: "GSC Cinemas", amount: 34, currency: "MYR", date: "2026-06-24", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Soda", price: 8 }] },
  { merchant: "Watsons", amount: 37.8, currency: "MYR", date: "2026-06-29", category: "Health", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Shampoo", price: 22.9 }, { name: "Vitamin C", price: 14.9 }] },

  // May
  { merchant: "Village Grocer", amount: 91.3, currency: "MYR", date: "2026-05-02", category: "Groceries", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Fresh produce", price: 39.3 }, { name: "Dairy & eggs", price: 27 }, { name: "Snacks", price: 25 }] },
  { merchant: "Grab", amount: 22.5, currency: "MYR", date: "2026-05-08", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Ride fare", price: 22.5 }] },
  { merchant: "TNB", amount: 148.7, currency: "MYR", date: "2026-05-01", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Electricity bill", items: [{ name: "Electricity usage", price: 148.7 }] },
  { merchant: "Din Tai Fung", amount: 78.2, currency: "SGD", date: "2026-05-14", category: "Food & Drink", tax: 5.5, city: "Singapore", country: "Singapore", note: "Weekend trip", items: [{ name: "Xiao long bao", price: 16.9 }, { name: "Fried rice", price: 14.5 }, { name: "Iced tea", price: 4, quantity: 2 }, { name: "Green beans", price: 16.65 }, { name: "Jasmine rice", price: 16.65 }] },
  { merchant: "Watsons", amount: 33.4, currency: "MYR", date: "2026-05-21", category: "Health", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Sunscreen", price: 24.9 }, { name: "Face wash", price: 8.5 }] },
  { merchant: "AEON", amount: 71.2, currency: "MYR", date: "2026-05-06", category: "Groceries", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Groceries", price: 52.2 }, { name: "Household items", price: 19 }] },
  { merchant: "Starbucks", amount: 19.9, currency: "MYR", date: "2026-05-12", category: "Food & Drink", tax: 1.2, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Caffe Latte", price: 13.63 }, { name: "Cookie", price: 5.07 }] },
  { merchant: "Petronas", amount: 78, currency: "MYR", date: "2026-05-18", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Fuel", items: [{ name: "RON95 fuel", price: 78 }] },
  { merchant: "TNB", amount: 151.9, currency: "MYR", date: "2026-05-01", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Electricity bill", items: [{ name: "Electricity usage", price: 151.9 }] },
  { merchant: "Guardian Pharmacy", amount: 26.4, currency: "MYR", date: "2026-05-24", category: "Health", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Hand sanitizer", price: 12.9 }, { name: "Vitamin C", price: 13.5 }] },
  { merchant: "Zara", amount: 210, currency: "MYR", date: "2026-05-29", category: "Shopping", tax: 11.9, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Coat", price: 149.99 }, { name: "Scarf", price: 48.11 }] },

  // April
  { merchant: "Jaya Grocer", amount: 84.2, currency: "MYR", date: "2026-04-04", category: "Groceries", tax: 4.8, city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Fresh produce", price: 41.68 }, { name: "Pantry items", price: 37.72 }] },
  { merchant: "Nando's", amount: 45.6, currency: "MYR", date: "2026-04-10", category: "Food & Drink", tax: 2.6, city: "Kuala Lumpur", country: "Malaysia", note: "Dinner with friends", items: [{ name: "Quarter chicken", price: 15.51, quantity: 2 }, { name: "Coleslaw", price: 11.98 }] },
  { merchant: "Petronas", amount: 75, currency: "MYR", date: "2026-04-16", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Fuel", items: [{ name: "RON95 fuel", price: 75 }] },
  { merchant: "Guardian Pharmacy", amount: 29.9, currency: "MYR", date: "2026-04-19", category: "Health", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Pain relief tablets", price: 15.9 }, { name: "Plasters", price: 14 }] },
  { merchant: "H&M", amount: 156, currency: "MYR", date: "2026-04-25", category: "Shopping", tax: 8.9, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Sweater", price: 83.92 }, { name: "Jeans", price: 63.18 }] },
  { merchant: "Mercato", amount: 102.4, currency: "MYR", date: "2026-04-02", category: "Groceries", tax: 5.8, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Groceries", price: 96.6 }] },
  { merchant: "Ippudo", amount: 58.9, currency: "MYR", date: "2026-04-08", category: "Food & Drink", tax: 3.4, city: "Kuala Lumpur", country: "Malaysia", note: "Ramen with the team", items: [{ name: "Akamaru ramen", price: 26.9 }, { name: "Gyoza", price: 12.9 }, { name: "Beer", price: 15.7 }] },
  { merchant: "Grab", amount: 19.5, currency: "MYR", date: "2026-04-13", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Ride fare", price: 19.5 }] },
  { merchant: "TM Unifi", amount: 129, currency: "MYR", date: "2026-04-06", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Internet bill", items: [{ name: "Internet subscription", price: 129 }] },
  { merchant: "GSC Cinemas", amount: 30, currency: "MYR", date: "2026-04-20", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Soda", price: 4 }] },
  { merchant: "Sephora", amount: 145, currency: "MYR", date: "2026-04-28", category: "Shopping", tax: 8.2, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Moisturizer", price: 83.97 }, { name: "Lipstick", price: 52.83 }] },

  // March
  { merchant: "Village Grocer", amount: 68.4, currency: "MYR", date: "2026-03-03", category: "Groceries", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Fresh produce", price: 32.4 }, { name: "Dairy & eggs", price: 21 }, { name: "Snacks", price: 15 }] },
  { merchant: "Starbucks", amount: 21.5, currency: "MYR", date: "2026-03-09", category: "Food & Drink", tax: 1.3, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Caffe Latte", price: 13.62 }, { name: "Croissant", price: 6.58 }] },
  { merchant: "Grab", amount: 18, currency: "MYR", date: "2026-03-14", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Ride fare", price: 18 }] },
  { merchant: "TNB", amount: 132.1, currency: "MYR", date: "2026-03-01", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Electricity bill", items: [{ name: "Electricity usage", price: 132.1 }] },
  { merchant: "GSC Cinemas", amount: 28, currency: "MYR", date: "2026-03-22", category: "Entertainment", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Movie ticket", price: 13, quantity: 2 }, { name: "Soda", price: 2 }] },
  { merchant: "AEON", amount: 54.6, currency: "MYR", date: "2026-03-05", category: "Groceries", city: "Petaling Jaya", state: "Selangor", country: "Malaysia", items: [{ name: "Groceries", price: 40.6 }, { name: "Household items", price: 14 }] },
  { merchant: "OldTown White Coffee", amount: 16.8, currency: "MYR", date: "2026-03-11", category: "Food & Drink", tax: 1, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Kopi O", price: 6.11 }, { name: "Kaya toast set", price: 9.69 }] },
  { merchant: "Touch 'n Go", amount: 30, currency: "MYR", date: "2026-03-16", category: "Transport", city: "Kuala Lumpur", country: "Malaysia", note: "Toll top-up", items: [{ name: "Toll reload", price: 30 }] },
  { merchant: "Unifi", amount: 129, currency: "MYR", date: "2026-03-06", category: "Bills & Utilities", city: "Kuala Lumpur", country: "Malaysia", note: "Internet bill", items: [{ name: "Internet subscription", price: 129 }] },
  { merchant: "MPH Bookstore", amount: 62.5, currency: "MYR", date: "2026-03-19", category: "Shopping", tax: 3.5, city: "Kuala Lumpur", country: "Malaysia", items: [{ name: "Novel", price: 37.67 }, { name: "Notebook", price: 21.33 }] },
  { merchant: "GNC", amount: 88, currency: "MYR", date: "2026-03-25", category: "Health", tax: 5, city: "Kuala Lumpur", country: "Malaysia", note: "Vitamins", items: [{ name: "Multivitamin bottle", price: 54.71 }, { name: "Protein bar", price: 9.43, quantity: 3 }] },
];
