# Agent Rules for powered by nexora

Follow the WMS plan exactly.

Forbidden fields and concepts:

- price
- cost
- tax
- profit
- discount
- total amount
- stock value
- COGS
- accounting entries

Core inventory rules:

- CurrentStock is read-only from UI.
- StockMovements is the audit trail for quantities.
- Quantities change only through approved operational documents.
- Use مستند وارد and مستند صادر.
- Soft delete important records.
- Approved documents cannot be edited.
