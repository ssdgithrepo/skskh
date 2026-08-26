# Shivsagar Krushi Seva Kendra & Hardware — Final Production UI Build

## Frontend
`shivsagar-app.html` is a single self-contained responsive frontend:
- branded public welcome page
- JS carousel
- products/services/contact sections
- logo on public and admin screens
- aesthetic agricultural login
- responsive Admin ERP
- live Google Sheets data views
- search, detail view, add record, refresh
- CSV/Sheet export
- print/PDF-ready export
- operation notifications and transitions

## Backend
`Code.gs` is the Apps Script API bridge to a private Google Sheet.

## Deployment
1. Create/configure the Google Sheet.
2. Open Extensions → Apps Script.
3. Add Code.gs and appsscript.json.
4. Set SS_ID.
5. Run setupDatabase().
6. Deploy as Web App, Execute as owner.
7. Copy `/exec` URL.
8. Replace YOUR_APPS_SCRIPT_EXEC_URL in the HTML.
9. Host the single HTML file on GitHub Pages.

## Security
Never put spreadsheet credentials or private keys in the HTML/GitHub. Change the bootstrap password immediately. For a true financial-production deployment, add secure password hashing, rate limiting, stronger session controls, atomic stock/invoice operations, immutable numbering, complete role-specific authorization and server-side PDF/XLSX generation.


## Full CRUD
Every operational entity now has Add, View, Edit and Delete controls. Add/Edit forms are generated from the entity schema, so all stored fields are editable rather than only a few generic fields. Deletes are authorized server-side and logged in AuditLog. Administrator can delete; Manager can update; other roles are restricted.


## Permission confirmations
The frontend now requires an explicit confirmation message before:
- Admin login submission
- Create/Save
- Update/Edit
- Delete
- Billing/transaction submission
- Switching Admin → Website
- Logging out
- Reloading the Admin Portal

A browser `beforeunload` guard also warns when leaving a signed-in Admin Portal.

## Transaction operations
The Apps Script API now has a transaction endpoint for Sales, Purchases, Sales Returns and Purchase Returns. Sales/purchases/returns can adjust Product stock server-side and create StockAdjustment records. The UI helper `submitTransaction()` requires confirmation before submission.

For strict financial production use, keep server-side validation, atomicity/locking, secure password hashing, rate limiting, immutable invoice numbering and role-based authorization enabled/implemented.


## POS / Billing
The build now includes a responsive POS billing screen:
- Product search
- Product cards with live stock
- Cart quantity control
- Remove items
- Customer field
- Payment mode
- Discount
- GST
- Automatic subtotal/taxable/GST/total calculation
- Permission confirmation before invoice submission
- Server-side Sales transaction
- Automatic stock deduction
- Sale item records
- Payment record for paid invoices
- Audit log
- Invoice number generation
- Printable invoice window

Purchases, sales returns and purchase returns are supported by the Apps Script transaction endpoint and can use the same transaction/stock workflow.


## CRUD coverage
The Admin menu now exposes CRUD modules for Products, Sales, Sale Items, Purchases, Purchase Items, Customers, Suppliers, Payments, Expenses, Sales Returns, Purchase Returns, Stock Adjustments, Users, Branches, Settings and Audit Log. The frontend uses lowercase UI keys and the Apps Script backend maps them to the exact Google Sheet names, fixing the previous Invalid entity/CRUD failure. Dashboard and Reports are read-only by design.


## Complete invoice line-item CRUD
Sales and Purchases now support transaction-level editing:
- Open the full invoice/GRN
- Load all line items
- Edit quantities and rates
- Remove line items
- Edit date, party, discount, GST, payment mode and status
- Confirm before submission
- Reverse the old inventory effect
- Apply the new inventory effect
- Replace line-item records
- Write an audit event

This prevents the common ERP error where the invoice header is changed but inventory and line items remain inconsistent.
