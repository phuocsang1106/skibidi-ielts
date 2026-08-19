Skibidi IELTS V2 - Render redirect hotfix

Problem:
Route handlers built redirects from request.url. On Render, request.url can use the internal origin http://localhost:10000, so login/register/logout/payment redirects can send the browser to localhost.

Fix:
- Adds publicAppUrl() in src/lib/security.ts.
- Uses APP_URL as the public redirect base in auth and payment route handlers.

After copying these files into the repo:
1. On Render set APP_URL to the public HTTPS service URL, e.g. https://YOUR-SERVICE.onrender.com
2. Commit and push.
3. Deploy latest commit (clear build cache is not required for this source-only change, but is safe).

Note:
The V2 database is separate from the old production database. Old V1 accounts do not exist in V2 unless migrated/imported. A fresh V2 database also needs the seed to create initial plans/settings/vocabulary before normal registration works.
