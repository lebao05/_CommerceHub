# ShopAdminWeb — CommerceHub Shop Admin Mockup

Mockup-only React admin UI built from `docs/APP-DESCRIPTION-FOR-UI.md` (Admin Panel)
and `docs/SCREENS-BREAKDOWN.md` (Admin Screens 4.1–4.14).

No backend. All data lives in `src/data/mock.js`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5174

## Screens

- Dashboard (`/`) — metrics, revenue chart, orders by status, activity feed
- Categories (`/categories`) — 3-level tree, add/edit modal
- Products (`/products`) — table, filters, approve/reject
- Orders (`/orders`) — table, filters, details drawer
- Users (`/users`) — role/status filters, activate/deactivate
- Promotions (`/promotions`) — list + create/edit modal
- Banners (`/banners`) — multiple live banners, positions, ordering
- Settings (`/settings`) — general, payment, shipping tabs
- Audit Logs (`/audit-logs`)
- Health (`/health`) — microservices status
- 404 (`*`)
