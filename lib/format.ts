export function formatBdt(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `৳${new Intl.NumberFormat("en-BD").format(safe)}`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function formatSeconds(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  return `${rounded}s`;
}
