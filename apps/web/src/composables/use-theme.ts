import { ref, watch } from "vue";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const DARK_SURFACE_0 = "#262427";
const LIGHT_SURFACE_0 = "#f9f8fb";

const getSystemTheme = (): "light" | "dark" =>
  globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const resolveTheme = (theme: Theme): "light" | "dark" =>
  theme === "system" ? getSystemTheme() : theme;

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark" || value === "system";
const raw = localStorage.getItem(STORAGE_KEY);
const stored: Theme = isTheme(raw) ? raw : "system";
const theme = ref<Theme>(stored);
const resolved = ref<"light" | "dark">(resolveTheme(stored));

const applyTheme = (mode: "light" | "dark"): void => {
  resolved.value = mode;
  document.documentElement.classList.toggle("dark", mode === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", mode === "dark" ? DARK_SURFACE_0 : LIGHT_SURFACE_0);
  }
};

watch(theme, (next) => {
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(resolveTheme(next));
});

globalThis.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (theme.value === "system") {
    applyTheme(getSystemTheme());
  }
});

applyTheme(resolved.value);

const toggleTheme = (): void => {
  theme.value = resolved.value === "dark" ? "light" : "dark";
};

const useTheme = (): {
  resolved: typeof resolved;
  theme: typeof theme;
  toggleTheme: typeof toggleTheme;
} => ({
  resolved,
  theme,
  toggleTheme,
});

export { useTheme };
