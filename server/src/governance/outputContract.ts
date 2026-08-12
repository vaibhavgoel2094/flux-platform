// The structured contract every agent's AI output must satisfy before a
// recommendation is allowed to reach a human. Ported and generalized from
// Flux Collect's domain.js — the parsing/validation shape is unchanged,
// only the source data it validates against is now agent-agnostic.

export const OUTPUT_FIELDS = [
  "STATUS", "CUSTOMER", "REFERENCE(S)", "SUMMARY", "IMPACT",
  "AUTONOMY LEVEL", "RECOMMENDED ACTION", "DECISION RATIONALE", "APPLIED POLICY",
  "SUPPORTING EVIDENCE", "RISK FLAGS", "CUSTOMER COMMUNICATION", "NEXT FOLLOW-UP DATE",
  "REQUIRED HUMAN APPROVAL", "DECISION STATUS", "WHY", "CITATIONS",
] as const;

export type OutputField = (typeof OUTPUT_FIELDS)[number];
export type ParsedFields = Partial<Record<OutputField, string>>;

const FIELD_ALIASES = new Map<string, OutputField>([
  ["REFERENCES", "REFERENCE(S)"], ["REFERENCE", "REFERENCE(S)"], ["INVOICE(S)", "REFERENCE(S)"],
  ["COLLECTIONS SUMMARY", "SUMMARY"], ["FOLLOW UP DATE", "NEXT FOLLOW-UP DATE"],
  ["NEXT FOLLOW UP DATE", "NEXT FOLLOW-UP DATE"], ["HUMAN APPROVAL", "REQUIRED HUMAN APPROVAL"],
  ["APPROVAL REQUIRED", "REQUIRED HUMAN APPROVAL"], ["PAYROLL IMPACT", "IMPACT"],
]);

function canonical(value = ""): OutputField | string {
  const normalized = value.toUpperCase().replace(/[_-]+/g, " ").replace(/[^A-Z()\s]/g, "").replace(/\s+/g, " ").trim();
  return FIELD_ALIASES.get(normalized) ?? (normalized as OutputField);
}

function cleanMarkdownLine(line: string): string {
  return String(line || "")
    .replace(/^\s*(?:[-+*]\s+|#{1,6}\s+)/, "")
    .replace(/\*\*|__|`/g, "")
    .trim();
}

function isKnownField(field: string): field is OutputField {
  return (OUTPUT_FIELDS as readonly string[]).includes(field);
}

function parseJsonOutput(rawText: string): ParsedFields | null {
  const source = String(rawText || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const object = JSON.parse(source.slice(start, end + 1));
    const fields: ParsedFields = {};
    for (const [key, value] of Object.entries(object)) {
      const field = canonical(key);
      if (!isKnownField(field)) continue;
      fields[field] = Array.isArray(value)
        ? value.join("; ")
        : value && typeof value === "object"
          ? JSON.stringify(value)
          : String(value ?? "");
    }
    return Object.keys(fields).length ? fields : null;
  } catch {
    return null;
  }
}

export interface ParsedAgentOutput {
  fields: ParsedFields;
  missing: OutputField[];
  valid: boolean;
  format: "json" | "labelled-text";
}

export function parseAgentOutput(rawText: string): ParsedAgentOutput {
  const jsonResult = parseJsonOutput(rawText);
  if (jsonResult) {
    const missing = OUTPUT_FIELDS.filter((field) => !jsonResult[field]?.trim());
    return { fields: jsonResult, missing, valid: missing.length === 0, format: "json" };
  }

  const result: ParsedFields = {};
  let current: OutputField | null = null;
  for (const line of String(rawText || "").split(/\r?\n/)) {
    const cleaned = cleanMarkdownLine(line);
    if (!cleaned || /^```/.test(cleaned)) continue;
    const match = cleaned.match(/^(.{2,60}?)(?:\s*:\s*|\s+[–—]\s+)(.*)$/);
    const headingField = canonical(cleaned.replace(/:$/, ""));
    if (match && isKnownField(canonical(match[1]))) {
      current = canonical(match[1]) as OutputField;
      result[current] = match[2].trim();
    } else if (isKnownField(headingField)) {
      current = headingField;
      result[current] ??= "";
    } else if (current) {
      result[current] = `${result[current]}\n${cleaned}`.trim();
    }
  }
  const missing = OUTPUT_FIELDS.filter((field) => !result[field]?.trim());
  return { fields: result, missing, valid: missing.length === 0, format: "labelled-text" };
}

export function classifyAutonomy(text = ""): "Human-led" | "Approval required" | "Autonomous" | "Unclassified" {
  const value = text.toUpperCase();
  if (value.includes("HUMAN-LED") || value.includes("HUMAN LED") || value.includes("NEVER AUTONOMOUS")) return "Human-led";
  if (value.includes("APPROVAL REQUIRED") || value.includes("HUMAN APPROVAL") || /\bDL[- ]?[01]\b/.test(value)) return "Approval required";
  if (value.includes("AUTONOMOUS") || value.includes("SUPERVISED AUTONOMY") || /\bDL[- ]?[23]\b/.test(value)) return "Autonomous";
  return "Unclassified";
}
