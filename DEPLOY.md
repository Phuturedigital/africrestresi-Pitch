# Deploy the Africrest demo

A 5-minute walkthrough to get the demo live at a URL you can send to Justin.

## Option A — Vercel CLI (fastest, ~3 minutes)

You'll need: a Vercel account (free tier is fine), and Node.js installed.

```bash
# 1. Install Vercel CLI globally (one-time)
npm install -g vercel

# 2. From the africrest/ folder
cd africrest

# 3. Login (opens a browser — pick GitHub or email)
vercel login

# 4. Deploy
vercel

# Answer the prompts:
#   Set up and deploy "africrest"?      → Y
#   Which scope?                        → your personal account
#   Link to existing project?           → N
#   What's your project's name?         → africrest-pitch
#   In which directory is your code?    → ./
#   Want to override settings?          → N
```

You'll get a URL like `africrest-pitch-abc123.vercel.app` printed in the terminal. **That's the link you send Justin.**

To redeploy after edits:
```bash
vercel --prod
```

## Option B — Vercel dashboard (no CLI)

1. Zip the `africrest/` folder
2. Go to <https://vercel.com/new>
3. Drag the zip onto the page
4. Click "Deploy"
5. Wait ~30 seconds → you get a URL

## Option C — Custom subdomain

Once deployed, you can attach `africrest-pitch.tlotliso.co.za` (or any subdomain on a domain you own) via:

1. Vercel project → **Settings → Domains**
2. Add `africrest-pitch.tlotliso.co.za`
3. Vercel shows you a CNAME record to add at your DNS provider — typically `cname.vercel-dns.com`
4. Wait 1–5 minutes for DNS propagation

## Recommended pre-pitch checklist

- [ ] Replace all Unsplash URLs with real Africrest photos (`scrape-africrest.js` then `bash replace-images.sh`)
- [ ] Open every page on desktop, click every link, make sure nothing 404s
- [ ] Open every page on your phone — verify the demo banner stacks, nav collapses
- [ ] Copy the Vercel URL into your browser, hit it from a clean session (no cached files)
- [ ] **Send Justin the URL 24 hours before the meeting** with the subject line:
      *"15 minutes — I want to show you something I built for africrestresi"*

## What's deployed

The `vercel.json` in this folder configures:

- **Clean URLs** — `/buildings` instead of `/buildings.html`
- **No-index headers** — Google won't crawl the demo (you don't want it competing with the real Africrest site in search results)
- **Sensible cache headers** — fast on second load
- **Security headers** — looks professional in any header-checker tool Justin's IT person might run

## If something breaks

- **"Module not found" or build error** — make sure you're in the `africrest/` folder, not its parent
- **Domain not resolving** — DNS can take up to 1 hour. Make a coffee.
- **Images broken** — you didn't run the image scraper. The Unsplash URLs work in production but you don't want generic stock photos in a pitch demo.
