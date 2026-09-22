import { mkdir, writeFile } from "node:fs/promises";

const defaultSiteUrl = "https://vector-training.vercel.app";
const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || defaultSiteUrl).replace(/\/$/, "");

if (!siteUrl.startsWith("https://")) {
  throw new Error("EXPO_PUBLIC_SITE_URL must use HTTPS in production.");
}

const routes = [
  ["/", "weekly", "1.0"],
  ["/about", "monthly", "0.6"],
  ["/how-it-works", "monthly", "0.8"],
  ["/science", "monthly", "0.7"],
  ["/privacy", "yearly", "0.4"],
  ["/terms", "yearly", "0.4"],
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(([route, frequency, priority]) => `  <url><loc>${siteUrl}${route}</loc><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /power
Disallow: /profile
Disallow: /training

Sitemap: ${siteUrl}/sitemap.xml
`;

await mkdir("public", { recursive: true });
await Promise.all([
  writeFile("public/sitemap.xml", sitemap),
  writeFile("public/robots.txt", robots),
]);
