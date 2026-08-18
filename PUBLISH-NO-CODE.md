# Publish Skibidi IELTS - No-code checklist

This copy is prepared for a first public beta deployment on Render + Neon.
You do not need to run Terminal commands locally.

## You need 3 free accounts

1. GitHub - stores the project files.
2. Neon - hosts the PostgreSQL database.
3. Render - runs the Next.js website and backend.

You also need a Gemini API credential for Writing grading.

## A. Upload this project to GitHub

1. Unzip `skibidi-ielts-PUBLISH-READY.zip` on your computer.
2. Open GitHub and create a new repository named `skibidi-ielts`.
3. Keep it Public for the easiest Render setup without connecting GitHub to Render.
4. Use GitHub's **uploading an existing file** option.
5. Drag all files and folders INSIDE the extracted `skibidi-ielts` folder into GitHub.
6. Commit the upload.

Never upload a real `.env` file. This project does not include one.

## B. Create the PostgreSQL database in Neon

1. Create a Neon project.
2. Copy its PostgreSQL connection string.
3. Keep it private. It looks like `postgresql://...`.

You will paste this value into Render as `DATABASE_URL`.

## C. Get Gemini credentials

1. Open Google AI Studio / Gemini Developer API.
2. Create the credential required by your Gemini account.
3. Keep it private.

You will paste it into Render as `GEMINI_API_KEY`.

## D. Deploy on Render

1. In Render choose **New > Blueprint**.
2. Connect Render to the GitHub repository you just created. This is a connection between Render and GitHub only; ChatGPT does not receive access.
3. Render reads `render.yaml` automatically.
4. Enter the secret values Render asks for:
   - `DATABASE_URL` - from Neon
   - `GEMINI_API_KEY` - from Gemini
   - `BANK_NAME` - can be blank while testing
   - `BANK_ACCOUNT_NUMBER` - can be blank while testing
   - `BANK_ACCOUNT_HOLDER` - can be blank while testing
   - `BANK_QR_IMAGE_URL` - can be blank while testing
5. `SESSION_SECRET` is generated automatically by Render.
6. Click Apply/Deploy.

During the first build, the project automatically:

- installs dependencies
- generates Prisma Client
- creates the PostgreSQL tables with `prisma db push`
- seeds the starter vocabulary
- builds Next.js

When deployment succeeds, Render gives you a public URL like:

`https://skibidi-ielts.onrender.com`

## E. Test before sharing

1. Open the Render URL.
2. Register a new account.
3. Log in.
4. Open Vocabulary and mark a word learned.
5. Refresh the page and confirm progress remains saved.
6. Submit a simple Task 2 Writing test.
7. Open Writing History and confirm the result is saved.

## F. Admin account

The app intentionally has no public Create Admin page. The current repository still uses a server-side CLI script for promotion. For the first public beta, leave all public accounts as USER until you are ready to perform the one-time admin promotion from Render Shell or another trusted server-side environment.

## Important beta limitations

- The vocabulary seed is only the starter dataset, not the final full content pack.
- `prisma db push` is used here to make the very first no-code beta deployment simple. Before a serious production launch with schema evolution, switch to committed Prisma migrations and `prisma migrate deploy`.
- Test Gemini image/PDF grading and payment flow yourself before accepting real payments.
- Do not publish database passwords or Gemini credentials anywhere public.
