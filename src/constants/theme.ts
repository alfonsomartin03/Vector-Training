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

    white: "#FFFFFF",
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
