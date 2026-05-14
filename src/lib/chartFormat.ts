export function formatChartDate(value: string): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return value;
}

export const axisTickStyle = { fontSize: 11, fill: "hsl(var(--foreground))" } as const;
export const axisStroke = "hsl(var(--foreground))";
export const tooltipContentStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
} as const;
export const tooltipLabelStyle = { color: "hsl(var(--foreground))" } as const;
export const tooltipItemStyle = { color: "hsl(var(--foreground))" } as const;