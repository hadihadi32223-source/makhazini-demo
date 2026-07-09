# powered by nexora Instructions

You are working on powered by nexora: an Arabic RTL Warehouse Management System.

Hard rules:

- No prices.
- No cost.
- No accounting.
- No taxes.
- No profit.
- No stock value.
- Use مستند وارد and مستند صادر.
- Do not use invoice terminology in Arabic UI.
- Inventory quantity must not be manually edited.
- Stock changes must create StockMovement records.
- Approved documents must not be edited.
- Use soft delete / disable for important records.
- Log important actions in AuditLog.
- Keep UI classic enterprise desktop-like, Arabic RTL, dense tables, clear filters.

Current stack:

- React
- TypeScript
- Vite
- Tailwind
- Vercel API handlers
- Supabase integration with local mock fallback

If converting to desktop later, use .NET 8 WPF + MVVM + EF Core.
