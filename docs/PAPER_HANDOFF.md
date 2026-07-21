# Gold paper handoff

When the paper is ready, provide as many of these items as possible. A title plus PDF is enough to start; the rest can be assembled collaboratively.

## Minimum handoff

- canonical title;
- PDF file or stable PDF URL;
- authors and publication date;
- why this paper matters to the intended reader in one or two sentences.

## Content decisions to make together

- five to seven material claims;
- the exact passage supporting each claim;
- at least two limitations, caveats, or contradictions;
- three concepts that need plain-language explanation;
- one investor question the paper helps answer;
- whether a market implication is defensible from the available evidence.

## Evidence record

Each material claim needs:

| Field            | Meaning                                                         |
| ---------------- | --------------------------------------------------------------- |
| `claimId`        | Stable identifier used by the interface                         |
| `claim`          | Concise, falsifiable statement                                  |
| `status`         | `supported`, `limited`, `contradicted`, or `insufficient`       |
| `evidenceText`   | Exact source passage; keep quotations short in public artifacts |
| `page`           | One-based PDF page number                                       |
| `bbox`           | Normalized `[x, y, width, height]` values between 0 and 1       |
| `explanation`    | Why the passage supports or limits the claim                    |
| `humanCheckedBy` | Person who verified the mapping                                 |

No material claim enters the final demo without a human-checked evidence record or an explicit insufficient-evidence result.
