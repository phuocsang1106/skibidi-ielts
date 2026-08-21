# V6 - Admin User Tools

## Added

- Admin user list now shows each user's Writing submission count.
- `Lich su` action opens all Writing submissions for a selected user.
- Admin can open a submission and inspect the stored IELTS feedback, band score, prompt, essay, and model used.
- `Login as user` creates a user session without deleting the current admin session.
- Impersonated user sessions carry the admin ID in the JWT (`impersonatedBy`).
- Dashboard displays an admin impersonation warning banner and a `Quay lai Admin` action.
- Stopping impersonation clears only the user session and returns to that user's admin history page.

## Database

No Prisma schema change and no migration are required for this update. Existing `WritingSubmission` records are used directly.

## Deploy

Use the same deploy process as V5. Install dependencies, then run the normal build command:

```bash
npm install
npm run build
```

Existing environment variables remain required, especially `SESSION_SECRET` and `ADMIN_SESSION_SECRET` (minimum 32 characters).

## Admin routes

- `/admin/users` - user management, submission count, history, login-as-user.
- `/admin/users/[id]` - selected user's Writing history.
- `/admin/users/[id]/submissions/[submissionId]` - full stored Writing result.
