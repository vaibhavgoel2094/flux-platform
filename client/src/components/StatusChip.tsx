const TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  Ready: "good",
  Autonomous: "good",
  Approval: "warn",
  "Approval required": "warn",
  Blocked: "bad",
  Disputed: "bad",
  Restricted: "bad",
  "Human-led": "bad",
  "Not analyzed": "neutral",
  "Recommendation ready": "good",
  "Human review required": "warn",
  Reviewed: "neutral",
  high: "bad",
  normal: "neutral",
  low: "neutral",
  pass: "good",
  fail: "bad",
};

export function StatusChip({ value }: { value: string }) {
  const tone = TONE[value] ?? "neutral";
  return <span className={`chip ${tone}`}>{value}</span>;
}
