export const theme = {
  colors: {
    background: "#F7F8F6",
    surface: "#FFFFFF",

    text: "#111315",
    textSecondary: "#62686B",

    border: "#E5E7E4",

    // Dark enough for WCAG AA normal text on both app backgrounds.
    accent: "#176B59",
    accentSoft: "#EAF7F3",

    // Shared glass surfaces keep the product's warm, restrained palette while
    // adding depth consistently across web and native layouts.
    glass: "rgba(255, 255, 255, 0.78)",
    glassStrong: "rgba(255, 255, 255, 0.92)",
    glassBorder: "rgba(255, 255, 255, 0.96)",
    accentGlass: "rgba(234, 247, 243, 0.78)",
    darkSurface: "#16211F",
    darkSurfaceSoft: "#24302D",

    white: "#FFFFFF",
  },

  shadows: {
    soft: "0 10px 26px rgba(30, 43, 39, 0.08)",
    raised: "0 18px 42px rgba(30, 43, 39, 0.13)",
    insetLike: "8px 10px 24px rgba(42, 58, 52, 0.08), -7px -7px 22px rgba(255, 255, 255, 0.86)",
  },

  layout: {
    contentMaxWidth: 1120,
    appHeaderHeight: 82,
    pagePadding: 24,
  },

  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 40,
    xxl: 64,
    xxxl: 96,
  },

  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    pill: 999,
  },

  typography: {
    hero: 64,
    h1: 44,
    h2: 30,
    body: 18,
    small: 14,
  },
} as const;
