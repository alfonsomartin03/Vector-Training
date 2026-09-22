# Website compliance checklist

This document maps the September 21, 2026 launch checklist to the implementation. Run `npm run check:compliance`, `npm run typecheck`, `npm run lint`, and `npm run build:web` before deployment.

| # | Requirement | Implementation and verification |
|---|---|---|
| 1 | Privacy policy | `/privacy` explains collected data, purposes, sharing, retention, rights, storage, children, transfers, changes, and contact. |
| 2 | Terms and conditions | `/terms` contains eligibility, account, fitness disclaimer, acceptable use, privacy, availability, IP, liability, and termination terms. |
| 3 | Secrets off the frontend | `.env` variants are ignored; the browser receives only Supabase's publishable key. Service-role credentials remain server-side in the Edge Function environment. |
| 4 | Force HTTPS | Vercel provides HTTPS redirection. HSTS and CSP `upgrade-insecure-requests` are configured, and the site-file generator rejects a non-HTTPS production URL. |
| 5 | Cookie consent | `PrivacyConsent` explains necessary storage and does not load optional analytics until explicit consent. The preference is stored locally. |
| 6 | Meta titles and descriptions | `Seo` supplies route-specific titles, descriptions, canonical URLs, robots rules, theme color, and viewport metadata during static rendering. |
| 7 | Social preview image | Open Graph and X/Twitter metadata use the 1200×630 `public/social-preview.png` asset. |
| 8 | Favicon | Expo web config uses `assets/images/favicon.png`; export produces `/favicon.ico`. |
| 9 | Sitemap and robots.txt | `site:prepare` generates both from `EXPO_PUBLIC_SITE_URL`; private account routes are disallowed and marked `noindex`. |
| 10 | Alt text on images | The social image has descriptive Open Graph alt text. In-app charts expose accessibility labels; the UI does not contain unlabeled content images. |
| 11 | Compress images | The compliance script rejects core raster assets above 900 KB. The largest shipped website image is currently the 657 KB social card. |
| 12 | Page load speed | The production export is minified and immutable assets receive long-lived cache headers. Current JS is 1.8 MB raw / approximately 476 KB gzip. Run a live Lighthouse test after deployment because network/server metrics cannot be measured locally. |
| 13 | Color contrast | Primary text uses `#111315`; secondary text is `#62686B`; text accent is `#176B59`. These combinations meet WCAG AA on the app's light backgrounds. |
| 14 | Mobile friendly | Responsive layouts use window breakpoints and wrapped controls. A 390×844 production-build check found no horizontal overflow. |
| 15 | Custom 404 | Expo Router's `+not-found` route provides a branded recovery page with a working home action. |
| 16 | Broken links | The previous no-op “Forgot your password?” control now sends a reset email to a working reset page. All referenced internal routes exist in `src/app`. |
| 17 | Form validation | Login, registration, password reset, athlete, availability, and performance inputs validate before submission and expose accessible errors, limits, and labels. |
| 18 | Spam protection | Registration uses a hidden honeypot, minimum interaction time, disabled duplicate submission, and Supabase Auth's server-side signup rate limiting. Enable Supabase CAPTCHA for high-risk traffic. |
| 19 | Analytics | Privacy-friendly analytics are wired through `EXPO_PUBLIC_ANALYTICS_DOMAIN` and load only after consent. No analytics script loads before approval. |
| 20 | Clear call to action | The landing hero leads with one primary action, “Build your profile,” with secondary explanatory navigation visually separated. |

## Deployment values

Set `EXPO_PUBLIC_SITE_URL` to the exact HTTPS production origin. To enable analytics, set `EXPO_PUBLIC_ANALYTICS_DOMAIN` to that domain. If analytics is hosted anywhere other than Plausible or the same origin, add that host to the production Content Security Policy deliberately.

The legal text is an implementation-ready baseline, not jurisdiction-specific legal advice. Have qualified counsel review it before a public launch.
