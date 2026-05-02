# Africrest pitch — concept site by Phuture Digital

Working concept site + pitch materials for Africrest Properties (Joburg built-to-rent landlord, ~15 estates). Built as a sales artifact for a redesign pitch.

**Not affiliated with Africrest Properties.** Real building data, illustrative photography, sample availability — every page carries a "Demo preview" banner.

## What's in here

```
africrest/
├── index.html              Home — search, value strip, building grid, units, apply, about
├── buildings.html          15 buildings with area filter chips
├── building.html           The Maestro detail (sticky CTA, gallery, facilities)
├── unit.html               Unit #304 detail (cost breakdown, SVG floor plan)
├── units.html              Filterable unit list (sidebar filters)
├── apply.html              4-phase + 11-step application flow
├── about.html              Five fundamentals + recognition + testimonials
├── contact.html            Form + 15 per-building on-site teams
├── styles.css              Design system (Cormorant Garamond + Inter + dark green/gold)
├── vercel.json             Production deploy config
│
├── DEPLOY.md               Vercel deployment walkthrough
├── outreach-package.md     Loom script + LinkedIn DM + email + objection handling
├── scrape-africrest.js     Image scraper — replaces Unsplash placeholders with real photos
│
└── africrest-pitch-deck.html   9-slide pitch deck (open in browser, F for fullscreen)
```

## Quick start

```bash
# Preview locally
python3 -m http.server 8000
# → http://localhost:8000

# Deploy to Vercel (instructions in DEPLOY.md)
npx vercel
```

## Pre-pitch checklist

- [ ] Run `scrape-africrest.js` to replace Unsplash placeholders with real Africrest photos (single biggest fix)
- [ ] Deploy to Vercel — see `DEPLOY.md`
- [ ] Record 3-min Loom — script in `outreach-package.md`
- [ ] Send LinkedIn DM to Justin Blend with Loom + demo URL

## Status

Demo is concept-only. Site to be wired to live Propficient availability data on engagement.

---

Built by [Phuture Digital](https://phuturedigital.co.za) · Johannesburg
