import { defineConfig, presetIcons, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  shortcuts: {
    "badge-base":
      "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full font-body",
    "btn-ghost":
      "px-4 py-2 text-sm text-muted border border-border rounded-lg transition-property-[color,background-color,border-color,box-shadow] duration-200 hover:text-foreground hover:border-muted hover:bg-surface-2 font-body",
    "btn-primary":
      "px-5 py-2.5 bg-accent text-accent-fg font-semibold rounded-lg text-sm transition-property-[background-color,box-shadow,transform,opacity] duration-200 hover:shadow-[var(--shadow-btn-primary)] active:scale-97 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none font-body",
    "card-base": "rounded-xl border border-border bg-surface-1",
    "card-hover":
      "rounded-xl border border-border bg-surface-1 transition-property-[border-color,box-shadow,transform] duration-300 ease-out hover:border-accent/50 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5",
    "input-base":
      "w-full rounded-lg border border-border bg-surface-1 px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-property-[border-color,box-shadow] duration-200 font-body",
    "section-title": "text-sm font-medium text-muted uppercase tracking-wider font-body",
  },
  theme: {
    colors: {
      accent: {
        DEFAULT: "rgb(var(--c-accent))",
        fg: "rgb(var(--c-accent-fg))",
      },
      border: "rgb(var(--c-border))",
      error: "rgb(var(--c-error))",
      foreground: "rgb(var(--c-foreground))",
      info: "rgb(var(--c-info))",
      muted: "rgb(var(--c-muted))",
      purple: "rgb(var(--c-purple))",
      success: "rgb(var(--c-success))",
      surface: {
        0: "rgb(var(--c-surface-0))",
        1: "rgb(var(--c-surface-1))",
        2: "rgb(var(--c-surface-2))",
        3: "rgb(var(--c-surface-3))",
      },
      warning: "rgb(var(--c-warning))",
    },
    fontFamily: {
      body: "'DM Sans', sans-serif",
      display: "'Outfit', sans-serif",
    },
  },
});
