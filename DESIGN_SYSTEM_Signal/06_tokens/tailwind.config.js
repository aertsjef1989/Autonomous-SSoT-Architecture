/** Signal design tokens v1.0  ·  Tailwind theme extension
 *  Usage: merge `theme.extend` into your tailwind.config.js.
 *  Classes: bg-page, text-ink, bg-pink, text-cyan-deep, rounded-card, p-card, gap-row, etc.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        page: "#FFFFFF",
        surface: "#F5F6F8",
        ink: "#14161C",
        muted: "#5B6270",
        hairline: "#E1E4EA",
        pink: { DEFAULT: "#F0245C", deep: "#C71048", tint: "#FDE7EE", soft: "#FF5C86" },
        cyan: { DEFAULT: "#21E0DC", deep: "#0E8A86", tint: "#E4FAF9", soft: "#7BF0EE" },
        dark: {
          bg: "#0B0C10", card: "#15171F", cardDeep: "#1E2230",
          line: "#2A2E3A", white: "#FFFFFF", mist: "#B9C0CE", faint: "#7A828F",
        },
      },
      fontFamily: {
        sans: ['Calibri', 'system-ui', 'Arial', 'sans-serif'],
      },
      fontSize: {
        title: ["32px", { lineHeight: "1.15", fontWeight: "700" }],
        h1: ["20px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["15px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["12px", { lineHeight: "1.3", fontWeight: "700" }],
        body: ["11px", { lineHeight: "1.3" }],
        muted: ["10px", { lineHeight: "1.3" }],
        eyebrow: ["9px", { lineHeight: "1", letterSpacing: "0.18em", fontWeight: "700" }],
      },
      spacing: {
        base: "4px", tight: "8px", snug: "12px", card: "16px", row: "20px", section: "32px",
      },
      borderRadius: { card: "8px", chip: "9999px" },
    },
  },
};
