import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  shortcuts: {
    "badge-base":
      "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full font-body",
    "btn-ghost":
      "px-4 py-2 text-sm text-muted border border-border rounded-lg transition-property-[color,background-color,border-color,box-shadow] duration-200 hover:text-foreground hover:border-muted hover:bg-surface-2 font-body",
    "btn-primary":
      "px-5 py-2.5 bg-accent text-surface-0 font-semibold rounded-lg text-sm transition-property-[background-color,box-shadow,transform,opacity] duration-200 hover:shadow-[0_0_20px_rgba(255,202,88,0.3)] active:scale-97 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none font-body",
    "card-base": "rounded-xl border border-border bg-surface-1",
    "card-hover":
      "rounded-xl border border-border bg-surface-1 transition-property-[border-color,box-shadow,transform] duration-300 ease-out hover:border-accent/50 hover:shadow-[0_2px_24px_rgba(255,202,88,0.12),0_0_0_1px_rgba(255,202,88,0.15)] hover:-translate-y-0.5",
    "input-base":
      "w-full rounded-lg border border-border bg-surface-1 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-property-[border-color,box-shadow] duration-200 font-body",
    "section-title": "text-sm font-medium text-muted uppercase tracking-wider font-body",
  },
  theme: {
    colors: {
      accent: "#ffca58",
      border: "#454349",
      error: "#ff7272",
      foreground: "#fcfcfa",
      info: "#49cae4",
      muted: "#908e96",
      purple: "#a093e2",
      success: "#bcdf59",
      surface: {
        0: "#262427",
        1: "#2d2b30",
        2: "#353339",
        3: "#3e3c42",
      },
    },
    fontFamily: {
      body: "'DM Sans', sans-serif",
      display: "'Outfit', sans-serif",
    },
  },
});
