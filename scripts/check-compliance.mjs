import { access, readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const requiredFiles = [
  "src/app/privacy.tsx",
  "src/app/terms.tsx",
  "src/app/+not-found.tsx",
  "src/components/Seo.tsx",
  "src/components/PrivacyConsent.tsx",
  "assets/images/favicon.png",
  "public/robots.txt",
  "public/sitemap.xml",
  "public/social-preview.png",
];

await Promise.all(requiredFiles.map((file) => access(file)));

const trackedEnvironment = await readFile(".gitignore", "utf8");
if (!trackedEnvironment.includes(".env")) throw new Error(".env files must be ignored");

const vercel = await readFile("vercel.json", "utf8");
for (const header of ["Strict-Transport-Security", "Content-Security-Policy", "X-Content-Type-Options"]) {
  if (!vercel.includes(header)) throw new Error(`Missing security header: ${header}`);
}

const layout = await readFile("src/app/_layout.tsx", "utf8");
for (const component of ["<Seo />", "<PrivacyConsent />"]) {
  if (!layout.includes(component)) throw new Error(`Root layout is missing ${component}`);
}

const imagePaths = [
  "assets/images/icon.png",
  "assets/images/favicon.png",
  "assets/images/splash-icon.png",
  "public/social-preview.png",
];
const oversized = [];
for (const image of imagePaths) {
  const { size } = await stat(image);
  if (size > 900_000) oversized.push(`${image} (${size} bytes)`);
}
if (oversized.length) throw new Error(`Images need compression: ${oversized.join(", ")}`);

const appFiles = await readdir("src/app");
const sourceFiles = await Promise.all(
  appFiles.filter((file) => file.endsWith(".tsx")).map(async (file) => [file, await readFile(`src/app/${file}`, "utf8")]),
);
const routeFiles = new Set(appFiles);
for (const [file, source] of sourceFiles) {
  for (const match of source.matchAll(/router\.(?:push|replace)\(\s*["']\/(.*?)["']\s*\)/g)) {
    const route = match[1];
    const target = route ? `${route}.tsx` : "index.tsx";
    if (!routeFiles.has(target)) throw new Error(`Broken internal route in ${file}: /${route}`);
  }
}

try {
  const homeHtml = await readFile("dist/index.html", "utf8");
  for (const metadata of ["<title", "name=\"description\"", "property=\"og:image\"", "rel=\"canonical\""]) {
    if (!homeHtml.includes(metadata)) throw new Error(`Production HTML is missing ${metadata}`);
  }

  const bundleDirectory = "dist/_expo/static/js/web";
  const bundleFiles = (await readdir(bundleDirectory)).filter((file) => file.endsWith(".js"));
  let compressedBytes = 0;
  for (const file of bundleFiles) {
    compressedBytes += gzipSync(await readFile(`${bundleDirectory}/${file}`)).byteLength;
  }
  if (compressedBytes > 550_000) throw new Error(`Compressed JS exceeds the 550 KB budget: ${compressedBytes} bytes`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  console.warn("No production export found; run npm run build:web for metadata and bundle-budget checks.");
}

console.log("Compliance checks passed.");
