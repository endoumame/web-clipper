// Magic number constants
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MIN_THRESHOLD = 1;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const MONTH_OFFSET = 1;
const PAD_LENGTH = 2;

const sourceBadgeStyles: Record<string, string> = {
  classmethod: "bg-warning/15 text-warning",
  devto: "bg-foreground/15 text-foreground",
  github: "bg-foreground/15 text-foreground",
  hatena: "bg-error/15 text-error",
  medium: "bg-foreground/15 text-foreground",
  note: "bg-success/15 text-success",
  other: "bg-muted/15 text-muted",
  qiita: "bg-success/15 text-success",
  stackoverflow: "bg-warning/15 text-warning",
  twitter: "bg-info/15 text-info",
  zenn: "bg-purple/15 text-purple",
};

const sourceLabels: Record<string, string> = {
  classmethod: "DevelopersIO",
  devto: "DEV",
  github: "GitHub",
  hatena: "はてな",
  medium: "Medium",
  note: "note",
  other: "その他",
  qiita: "Qiita",
  stackoverflow: "Stack Overflow",
  twitter: "Twitter",
  zenn: "Zenn",
};

const extractDomain = function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
};

const formatDateParts = function formatDateParts(date: Date): string {
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + MONTH_OFFSET).padStart(PAD_LENGTH, "0");
  const dy = String(date.getDate()).padStart(PAD_LENGTH, "0");
  return `${yr}/${mo}/${dy}`;
};

const computeDiffs = function computeDiffs(date: Date): {
  diffDay: number;
  diffHour: number;
  diffMin: number;
} {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return {
    diffDay: Math.floor(diffMs / MS_PER_DAY),
    diffHour: Math.floor(diffMs / MS_PER_HOUR),
    diffMin: Math.floor(diffMs / MS_PER_MINUTE),
  };
};

const formatRelativeOrAbsolute = function formatRelativeOrAbsolute(
  diffs: { diffDay: number; diffHour: number; diffMin: number },
  date: Date,
): string {
  if (diffs.diffMin < MIN_THRESHOLD) {
    return "たった今";
  }
  if (diffs.diffMin < MINUTES_PER_HOUR) {
    return `${diffs.diffMin}分前`;
  }
  if (diffs.diffHour < HOURS_PER_DAY) {
    return `${diffs.diffHour}時間前`;
  }
  if (diffs.diffDay < DAYS_PER_WEEK) {
    return `${diffs.diffDay}日前`;
  }
  return formatDateParts(date);
};

const formatRelativeDate = function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffs = computeDiffs(date);
  return formatRelativeOrAbsolute(diffs, date);
};

const formatDate = function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ja-JP");
};

export { extractDomain, formatDate, formatRelativeDate, sourceBadgeStyles, sourceLabels };
