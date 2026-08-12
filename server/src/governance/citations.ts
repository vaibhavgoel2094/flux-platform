// Citation enforcement: a recommendation is only accepted if it names the
// record it's about and the policy section it applied. No citation, no
// decision — ported from Flux Collect's canonicalCitations/fromLiveOutput.

export function extractCitations(text = ""): Set<string> {
  const citations = new Set<string>();
  const pattern = /\b([a-z0-9_-]+\.(?:csv|md|json))\s*(?::|#|\s[-–—]?\s*)\s*([a-z]{2,}-?\d+)\b/gi;
  for (const match of String(text).matchAll(pattern)) {
    citations.add(`${match[1]}:${match[2].toUpperCase()}`);
  }
  return citations;
}

export interface CitationCheck {
  citations: Set<string>;
  hasReference: boolean;
  hasPolicy: boolean;
  valid: boolean;
}

export function verifyCitations(params: {
  citationText: string;
  supportingEvidenceText: string;
  referenceId: string;
  policyCode: string;
}): CitationCheck {
  const citations = extractCitations(params.citationText);
  const combinedEvidence = `${params.citationText}\n${params.supportingEvidenceText}`;

  const hasReference =
    [...citations].some((v) => v.endsWith(`:${params.referenceId.toUpperCase()}`)) ||
    (combinedEvidence.includes(params.referenceId) && citations.add(`records.json:${params.referenceId}`) !== undefined);

  const policyCodes = params.policyCode.match(/[A-Z]{2,}-\d+/g) ?? [];
  let hasPolicy = policyCodes.length === 0;
  for (const code of policyCodes) {
    if (combinedEvidence.toUpperCase().includes(code)) {
      citations.add(`policy.md:${code}`);
      hasPolicy = true;
    }
  }

  return { citations, hasReference, hasPolicy, valid: hasReference && hasPolicy };
}
