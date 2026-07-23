import {
  EvidenceSpanSchema,
  PaperVersionSchema,
  schemaVersion,
  type EvidenceSpan,
  type PaperVersion,
} from '@glyph/domain'

export const kimiPaperVersion: PaperVersion = PaperVersionSchema.parse({
  schemaVersion,
  id: 'kimi-k3-tech-blog-2026-07-21',
  paperId: 'kimi-k3',
  versionLabel: 'Launch post captured 2026-07-21',
  checksumSha256:
    'b1d22e78cf9da8494f43bec4eb57a9146afdaf9460c0c6c157df4d2b4a2b1017',
  licenceStatus: 'PUBLIC',
  publicationDate: '2026-07-21',
  revisionDate: '2026-07-21',
  pageCount: 21,
  assetPath: '/papers/kimi-k3-tech-blog.pdf',
})

export const kimiEvidenceSpans: EvidenceSpan[] = [
  evidence({
    id: 'evidence-model-scale',
    pageNumber: 1,
    section: 'Launch introduction',
    exactText:
      'Kimi K3 is a 2.8T-parameter model built on our Kimi Delta Attention and Attention Residuals, with native vision capabilities and a 1-million-token context window.',
    boxes: [
      { x: 0.740522, y: 0.614666, width: 0.123498, height: 0.016926 },
      { x: 0.105469, y: 0.639609, width: 0.705279, height: 0.016926 },
      { x: 0.105469, y: 0.664552, width: 0.699215, height: 0.016926 },
      { x: 0.105469, y: 0.689495, width: 0.085524, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-routing',
    pageNumber: 4,
    section: 'Open 3T-class model',
    exactText:
      'We have also scaled up Mixture of Experts (MoE) sparsity, effectively activating 16 out of 896 experts when paired with a Stable LatentMoE framework. Together with refined training and data recipes, these structural changes yield an approximate 2.5× improvement in overall scaling efficiency compared to Kimi K2, allowing the model to convert compute into intelligence more effectively.',
    boxes: [
      { x: 0.59298, y: 0.484607, width: 0.23967, height: 0.016926 },
      { x: 0.105469, y: 0.50955, width: 0.77857, height: 0.016926 },
      { x: 0.105469, y: 0.534493, width: 0.722895, height: 0.016926 },
      { x: 0.105469, y: 0.559436, width: 0.779449, height: 0.016926 },
      { x: 0.105469, y: 0.584379, width: 0.765755, height: 0.016926 },
      { x: 0.105469, y: 0.609322, width: 0.609487, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-kda-attnres',
    pageNumber: 15,
    section: 'Architecture and infrastructure',
    exactText:
      'Kimi K3 is built on Kimi Delta Attention (KDA) and Attention Residuals (AttnRes). KDA provides an efficient foundation for scaling attention, while AttnRes selectively retrieves representations across depth rather than accumulating them uniformly.',
    boxes: [
      { x: 0.105469, y: 0.633374, width: 0.706844, height: 0.016926 },
      { x: 0.105469, y: 0.658317, width: 0.749618, height: 0.016926 },
      { x: 0.105469, y: 0.68326, width: 0.700115, height: 0.016926 },
      { x: 0.105469, y: 0.708203, width: 0.300703, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-routing-stability',
    pageNumber: 15,
    section: 'Architecture and infrastructure',
    exactText:
      'Kimi K3 uses Stable LatentMoE, effectively activating 16 of 896 experts. At this level of sparsity, routing and optimization become first-order challenges. Quantile Balancing derives expert allocation directly from router-score quantiles, eliminating heuristic updates and a sensitive balancing hyperparameter, while Per-Head Muon extends Muon by optimizing attention heads independently for more adaptive learning at scale. Sigmoid Tanh Unit (SiTU) and Gated MLA improve activation control and attention selectivity',
    boxes: [
      { x: 0.105469, y: 0.772342, width: 0.75564, height: 0.016926 },
      { x: 0.105469, y: 0.797285, width: 0.773984, height: 0.016926 },
      { x: 0.105469, y: 0.822228, width: 0.707873, height: 0.016926 },
      { x: 0.105469, y: 0.847171, width: 0.653847, height: 0.016926 },
      { x: 0.105469, y: 0.872114, width: 0.777734, height: 0.016926 },
      { x: 0.105469, y: 0.897057, width: 0.764833, height: 0.016926 },
      { x: 0.105469, y: 0.922, width: 0.742139, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-quantization',
    pageNumber: 16,
    section: 'Architecture and infrastructure',
    exactText:
      'Kimi K3 applies quantization-aware training from the SFT stage onward, using MXFP4 weights with MXFP8 activations for broad hardware compatibility.',
    boxes: [
      { x: 0.105469, y: 0.098881, width: 0.787935, height: 0.016926 },
      { x: 0.105469, y: 0.123824, width: 0.742632, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-serving-system',
    pageNumber: 16,
    section: 'Architecture and infrastructure',
    exactText:
      'To prevent expert imbalance from degrading throughput at large expert-parallel scales, we introduce a fully balanced expert-parallel training method with static shapes and no host synchronization on the critical path. Since inference efficiency likewise benefits from larger high-bandwidth communication domains, we recommend deploying Kimi K3 on supernode configurations with 64 or more accelerators. Finally, as KDA poses new challenges for conventional prefix caching, we have contributed a corresponding implementation to the vLLM community, to be released alongside the model.',
    boxes: [
      { x: 0.852412, y: 0.123824, width: 0.026506, height: 0.016926 },
      { x: 0.105469, y: 0.148767, width: 0.772055, height: 0.016926 },
      { x: 0.105469, y: 0.17371, width: 0.739932, height: 0.016926 },
      { x: 0.105469, y: 0.198653, width: 0.787871, height: 0.016926 },
      { x: 0.105469, y: 0.223596, width: 0.714687, height: 0.016926 },
      { x: 0.105469, y: 0.248539, width: 0.738818, height: 0.016926 },
      { x: 0.105469, y: 0.273482, width: 0.718352, height: 0.016926 },
      { x: 0.105469, y: 0.298425, width: 0.665505, height: 0.016926 },
      { x: 0.105469, y: 0.323368, width: 0.777563, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-api-economics',
    pageNumber: 16,
    section: 'Availability',
    exactText:
      "Pricing is $0.30/MTok for cache-hit input, $3.00/MTok for cache-miss input, and $15.00/MTok for output. Powered by Mooncake's disaggregated inference architecture, the official Kimi API achieves a cache hit rate above 90% in coding workloads.",
    boxes: [
      { x: 0.135723, y: 0.806193, width: 0.703265, height: 0.016926 },
      { x: 0.135723, y: 0.831136, width: 0.750818, height: 0.016926 },
      { x: 0.135723, y: 0.856079, width: 0.757547, height: 0.016926 },
      { x: 0.135723, y: 0.881022, width: 0.260779, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-pending-technical-report',
    pageNumber: 3,
    section: 'Launch availability',
    exactText:
      'The full model weights will be released by July 27, 2026. Further details on the architecture, training, and evaluations will be released alongside the Kimi K3 technical report.',
    boxes: [
      { x: 0.791679, y: 0.378599, width: 0.078688, height: 0.016926 },
      { x: 0.105469, y: 0.403542, width: 0.712201, height: 0.016926 },
      { x: 0.105469, y: 0.428485, width: 0.771048, height: 0.016926 },
      { x: 0.105469, y: 0.453428, width: 0.166187, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-benchmark-harness',
    pageNumber: 17,
    section: 'Benchmark footnotes',
    exactText:
      "All Kimi K3 results reported below are obtained with the reasoning effort set to 'max', setting temperature = 1.0 and top-p = 1.0. Depending on the benchmark, each model is evaluated under one of three agentic harnesses — KimiCode, Claude Code, or Codex — as specified in the notes below.",
    boxes: [
      { x: 0.105469, y: 0.658317, width: 0.764683, height: 0.016926 },
      { x: 0.105469, y: 0.68326, width: 0.679971, height: 0.016926 },
      { x: 0.105469, y: 0.708203, width: 0.762991, height: 0.016926 },
      { x: 0.105469, y: 0.733146, width: 0.678771, height: 0.016926 },
    ],
  }),
  evidence({
    id: 'evidence-limitations',
    pageNumber: 20,
    section: 'Limitations',
    exactText:
      'K3 was trained in the preserved thinking history mode. If the agent harness fails to pass back all the historical thinking content as required, or if an ongoing session with another model is switched over to K3, generation quality may become highly unstable.',
    boxes: [
      { x: 0.454695, y: 0.398197, width: 0.407381, height: 0.016926 },
      { x: 0.135723, y: 0.42314, width: 0.682757, height: 0.016926 },
      { x: 0.135723, y: 0.448083, width: 0.75684, height: 0.016926 },
      { x: 0.135723, y: 0.473026, width: 0.688436, height: 0.016926 },
    ],
  }),
]

const paperVersions = new Map<string, PaperVersion>([
  [kimiPaperVersion.id, kimiPaperVersion],
])
const evidenceByPaperVersion = new Map<string, EvidenceSpan[]>([
  [kimiPaperVersion.id, kimiEvidenceSpans],
])

export function paperVersionById(id: string): PaperVersion | null {
  return paperVersions.get(id) ?? null
}

export function evidenceForPaperVersion(id: string): EvidenceSpan[] {
  return evidenceByPaperVersion.get(id) ?? []
}

function evidence(input: {
  id: string
  pageNumber: number
  section: string
  exactText: string
  boxes: Array<{ x: number; y: number; width: number; height: number }>
}): EvidenceSpan {
  return EvidenceSpanSchema.parse({
    schemaVersion,
    paperVersionId: kimiPaperVersion.id,
    ...input,
  })
}
