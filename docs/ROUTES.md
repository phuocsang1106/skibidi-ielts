# Route map

## Public

- `/` — landing page
- `/pricing` — database-driven public pricing
- `/login`
- `/register`

## Authenticated learner app

- `/app/dashboard`
- `/app/vocabulary`
- `/app/vocabulary/[levelSlug]/[topicSlug]`
- `/app/writing`
- `/app/history`
- `/app/history/[id]`
- `/app/pricing`
- `/app/settings`

## Admin

- `/admin`
- `/admin/users`
- `/admin/users/[id]`
- `/admin/plans`
- `/admin/plans/[id]`
- `/admin/promo-codes`
- `/admin/promo-codes/[id]`
- `/admin/payments`
- `/admin/writing`
- `/admin/writing/[id]`
- `/admin/reports`
- `/admin/vocabulary`
- `/admin/ai`
- `/admin/ai/[logicalSubmissionId]` — pipeline diagnostics, including failures before Writing persistence
- `/admin/audit-log`
- `/admin/settings`

## Route handlers

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/writing/submit`
- `POST /api/vocabulary/progress`
- `POST /api/reports`
- `POST /api/promo/redeem`
- `POST /api/payments/create`
- `POST /api/payments/report`
