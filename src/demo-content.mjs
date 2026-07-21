export const demoContent = {
  meta: {
    fixture: true,
    fixtureLabel: 'Synthetic fixture — replace before submission',
    readingTime: '5 min',
    lastReviewed: 'Paper handoff pending',
  },
  product: {
    name: 'Glyph',
    promise: 'Read the signal. Inspect the proof.',
  },
  candidates: [
    {
      id: 'adaptive-routing',
      rank: 1,
      title: 'Adaptive Inference Routing for Budget-Aware Models',
      source: 'Synthetic demo paper',
      score: 91,
      signal: 'Mechanism',
      reason:
        'A concrete systems mechanism with a measurable cost–quality trade-off and testable deployment implications.',
      selected: true,
    },
    {
      id: 'memory-compression',
      rank: 2,
      title: 'Compressed Long-Horizon Memory for Tool-Using Agents',
      source: 'Synthetic candidate',
      score: 84,
      signal: 'Capability',
      reason:
        'Potentially important for agent reliability, but the current evaluation set is too narrow for a stronger conclusion.',
    },
    {
      id: 'data-governance',
      rank: 3,
      title: 'Auditable Data Lineage for Multimodal Training',
      source: 'Synthetic candidate',
      score: 79,
      signal: 'Governance',
      reason:
        'High decision relevance and unusually clear provenance methods, with limited evidence about performance cost.',
    },
    {
      id: 'scaling-note',
      rank: 4,
      title: 'A Note on Sparse Scaling Under Fixed Compute',
      source: 'Synthetic candidate',
      score: 72,
      signal: 'Watch',
      reason:
        'Interesting result, but insufficient replication detail and too much overlap with a recent selected paper.',
    },
  ],
  paper: {
    id: 'adaptive-routing',
    title: 'Adaptive Inference Routing for Budget-Aware Models',
    authors: 'A. Researcher, B. Builder, C. Analyst',
    venue: 'Synthetic fixture · not a real publication',
    published: 'Replace with source date',
    thesis:
      'A routing policy can allocate more inference compute only when an input appears to need it, improving the quality–cost frontier without applying the largest budget to every request.',
    whyNow:
      'Inference economics increasingly determine which model capabilities are viable at product scale. A mechanism that changes cost allocation—not merely average benchmark quality—could matter to both model providers and application companies.',
    investorQuestion:
      'Does adaptive inference change who can offer high-quality model experiences at sustainable margins?',
    tags: ['Inference', 'Routing', 'Economics', 'Systems'],
  },
  report: {
    executive: {
      label: 'Executive',
      summary:
        'The synthetic paper proposes a controller that predicts how much inference effort an input deserves. In the fixture results, dynamic allocation preserves most quality gains while reducing average compute use. The decision-relevant point is not a headline benchmark win; it is the possibility of serving uneven workloads with a better cost profile.',
      takeaway:
        'Worth investigating as an infrastructure mechanism, but not yet evidence that application margins improve in production.',
      questions: [
        'Does the routing policy remain reliable under real traffic shifts?',
        'How much latency does the controller add?',
        'Who captures the savings: model provider, cloud, or application?',
      ],
    },
    mechanism: {
      label: 'Mechanism',
      summary:
        'A lightweight controller estimates input difficulty, assigns one of three compute budgets, and monitors confidence during generation. Requests can stop early or move to a larger budget. Training combines task loss with a penalty for compute use, turning the routing choice into an explicit optimization target.',
      takeaway:
        'The paper’s novelty is the closed-loop budget decision. Its value depends on calibration: cheap requests must remain cheap while hard requests are escalated reliably.',
      questions: [
        'Is difficulty estimated before generation or continuously?',
        'Can an adversarial input force expensive routing?',
        'Does the policy generalize across model families?',
      ],
    },
    evidence: {
      label: 'Evidence',
      summary:
        'The synthetic evaluation compares fixed and adaptive budgets across three task groups. It reports lower average token-compute use at similar aggregate quality, but omits production latency, pricing, traffic mix, and independent replication. One market claim is therefore deliberately rejected as insufficiently supported.',
      takeaway:
        'The mechanism is plausible inside the fixture. The commercial conclusion remains open.',
      questions: [
        'Are averages hiding failures on a critical task class?',
        'Were baselines tuned to the same latency constraint?',
        'What evidence would connect compute savings to realized gross margin?',
      ],
    },
  },
  claims: [
    {
      id: 'claim-routing',
      status: 'supported',
      label: 'Supported',
      claim:
        'The proposed controller assigns different inference budgets based on predicted input difficulty.',
      evidenceText:
        'The controller maps each request to one of three compute budgets and may escalate the request when intermediate confidence remains below the calibrated threshold.',
      page: 4,
      bbox: [0.12, 0.31, 0.76, 0.15],
      explanation:
        'The passage directly describes both initial routing and conditional escalation.',
    },
    {
      id: 'claim-compute',
      status: 'limited',
      label: 'Supported with limitation',
      claim:
        'Adaptive routing reduces average inference compute while preserving most of the measured quality gain.',
      evidenceText:
        'Across the synthetic evaluation suite, adaptive allocation uses 28% less average token-compute than the high fixed budget while retaining 96% of its aggregate score improvement.',
      page: 7,
      bbox: [0.1, 0.42, 0.8, 0.18],
      explanation:
        'The fixture supports the benchmark result, not production cost, latency, or generalization.',
    },
    {
      id: 'claim-margin',
      status: 'insufficient',
      label: 'Insufficient evidence',
      claim: 'The method will improve application gross margins in production.',
      evidenceText:
        'No production pricing, traffic distribution, serving overhead, or realized margin data is included in the synthetic fixture.',
      page: null,
      bbox: null,
      explanation:
        'Compute efficiency may affect cost, but the paper does not establish who captures savings or whether added routing overhead offsets them.',
    },
  ],
  concepts: [
    {
      id: 'routing-policy',
      name: 'Routing policy',
      plain:
        'A rule that decides how much computational effort a request receives.',
      detail:
        'The policy converts signals about difficulty or confidence into a budget choice. It matters because a poor policy either wastes compute on easy inputs or under-serves hard ones.',
      analogy:
        'Like triage: routine cases take the fast path; uncertain cases receive more attention.',
    },
    {
      id: 'calibration',
      name: 'Calibration',
      plain:
        'How well a confidence score matches the system’s actual chance of being right.',
      detail:
        'Routing depends on confidence being meaningful. If the model is confidently wrong, the controller may stop early precisely when more work is needed.',
      analogy:
        'A weather forecast is calibrated when ‘70% chance of rain’ events actually rain about 70% of the time.',
    },
    {
      id: 'frontier',
      name: 'Quality–cost frontier',
      plain: 'The best quality attainable at each level of cost.',
      detail:
        'A method improves the frontier only if it achieves better quality for the same cost or the same quality for less cost—not merely if it is cheaper and worse.',
      analogy:
        'It is the set of travel options where no alternative is both faster and cheaper.',
    },
  ],
  market: {
    headline: 'A plausible cost-allocation lever, not yet a margin result',
    chain: [
      'Difficulty-aware routing',
      'Lower average inference compute',
      'Potential serving-cost reduction',
      'Possible pricing or margin flexibility',
    ],
    caveat:
      'Only the first two links are represented by the synthetic paper fixture. Serving cost, pricing, and margin require external operating evidence.',
    metric: {
      name: 'Average token-compute change',
      value: '−28%',
      context: 'Synthetic evaluation only',
      asOf: 'Fixture; no market timestamp',
    },
    companies: [
      {
        name: 'Model providers',
        note: 'May capture value through lower serving cost or differentiated pricing.',
      },
      {
        name: 'Inference platforms',
        note: 'May benefit if orchestration becomes a distinct optimization layer.',
      },
      {
        name: 'AI applications',
        note: 'Benefit depends on contract structure and whether savings pass through.',
      },
    ],
  },
  review: [
    {
      id: 'source',
      label: 'Canonical source and rights verified',
      ready: false,
    },
    {
      id: 'claims',
      label: 'Every material claim has evidence or an insufficient result',
      ready: true,
    },
    {
      id: 'limitations',
      label: 'Limitations remain visible in the executive layer',
      ready: true,
    },
    {
      id: 'market',
      label: 'Market data is sourced, comparable, and timestamped',
      ready: false,
    },
    {
      id: 'human',
      label: 'Human editor completed final technical review',
      ready: false,
    },
  ],
}

export function findClaim(claimId) {
  return (
    demoContent.claims.find((claim) => claim.id === claimId) ||
    demoContent.claims[0]
  )
}

export function readinessSummary(items = demoContent.review) {
  const complete = items.filter((item) => item.ready).length
  return {
    complete,
    total: items.length,
    publishable: complete === items.length,
  }
}
