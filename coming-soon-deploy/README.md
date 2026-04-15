# Coming soon — Vercel placeholder

Static single page. Deploy **only this folder** so your production URL shows the placeholder, not the full Next.js app.

## Deploy on Vercel (recommended)

1. Push this repo to GitHub/GitLab/Bitbucket (if it isn’t already).
2. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
3. **Import** your repository.
4. Under **Configure Project**:
   - **Root Directory**: click **Edit** → set to `coming-soon-deploy` (the folder that contains `index.html`).
   - **Framework Preset**: **Other** (no framework).
   - **Build Command**: leave **empty**.
   - **Output Directory**: leave **empty** (Vercel serves `index.html` from the project root of that folder).
5. **Deploy**.

After deploy, opening the Vercel URL shows only the coming-soon HTML page.

## Optional: deploy from CLI

```bash
cd coming-soon-deploy
npx vercel
```

Follow prompts; for production: `npx vercel --prod`.

## Later: switch to the real app

In the same Vercel project → **Settings** → **General** → **Root Directory**: change from `coming-soon-deploy` to `ai-community-lab-frontend` (or your app path), set **Framework** to **Next.js**, then redeploy.

Or create a **second Vercel project** for the full app and keep this deployment as a separate preview/staging URL.
