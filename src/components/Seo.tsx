import Head from "expo-router/head";
import { usePathname } from "expo-router";

const DEFAULT_SITE_URL = "https://vector-training.vercel.app";

const PAGE_METADATA: Record<string, { title: string; description: string; noIndex?: boolean }> = {
  "/": {
    title: "Vector Training | Adaptive Cycling Training",
    description: "Personalized cycling training built from your power profile, physiology, goals, and weekly availability.",
  },
  "/about": {
    title: "About Vector Training",
    description: "Learn why Vector turns cycling performance data into clear, individualized training decisions.",
  },
  "/how-it-works": {
    title: "How Vector Training Works",
    description: "See how Vector analyzes your physiology and builds focused, adaptive cycling training.",
  },
  "/science": {
    title: "The Science Behind Vector Training",
    description: "Explore the exercise physiology and training principles that inform Vector's cycling guidance.",
  },
  "/privacy": {
    title: "Privacy Policy | Vector Training",
    description: "How Vector Training collects, uses, protects, and deletes athlete and account data.",
  },
  "/terms": {
    title: "Terms and Conditions | Vector Training",
    description: "The terms governing use of Vector Training and its informational cycling guidance.",
  },
  "/login": {
    title: "Log In | Vector Training",
    description: "Sign in to your Vector Training account.",
    noIndex: true,
  },
  "/register": {
    title: "Create Your Athlete Profile | Vector Training",
    description: "Create a Vector Training account and build your individualized cycling profile.",
    noIndex: true,
  },
  "/reset-password": {
    title: "Reset Password | Vector Training",
    description: "Choose a new password for your Vector Training account.",
    noIndex: true,
  },
  "/dashboard": { title: "Dashboard | Vector Training", description: "Your private Vector Training dashboard.", noIndex: true },
  "/training": { title: "Training Plan | Vector Training", description: "Your private adaptive cycling training plan.", noIndex: true },
  "/power": { title: "Power Profile | Vector Training", description: "Your private cycling power and physiology profile.", noIndex: true },
  "/profile": { title: "Account Profile | Vector Training", description: "Manage your private Vector Training profile.", noIndex: true },
  "/admin": { title: "Administration | Vector Training", description: "Vector Training account administration.", noIndex: true },
};

function normalizedSiteUrl() {
  return (process.env.EXPO_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function Seo() {
  const pathname = usePathname() || "/";
  const metadata = PAGE_METADATA[pathname] ?? {
    title: "Page Not Found | Vector Training",
    description: "The requested Vector Training page could not be found.",
    noIndex: true,
  };
  const siteUrl = normalizedSiteUrl();
  const canonical = `${siteUrl}${pathname === "/" ? "" : pathname}`;
  const socialImage = `${siteUrl}/social-preview.png`;

  return (
    <Head>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#F7F8F6" />
      <meta name="robots" content={metadata.noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Vector Training" />
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Vector Training — training in the right direction" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={metadata.description} />
      <meta name="twitter:image" content={socialImage} />
    </Head>
  );
}
