import type { VisualSpec } from '@glyph/domain'

export const kimiDigestCards = [
  {
    id: 'source-claim',
    title: 'What this source claims',
    body: 'Moonshot presents Kimi K3 as a 2.8T-parameter model using Kimi Delta Attention and Attention Residuals, with native vision and a 1-million-token context window.',
    provenance: 'AUTHOR CLAIM · SOURCE PAGE 1',
    pageNumber: 1,
    evidenceId: 'evidence-model-scale',
  },
  {
    id: 'why-it-matters',
    title: 'Why it matters',
    body: 'The release moves the open-model frontier to 3T-class scale while combining sparse routing, linear attention, and depth-wise residual retrieval.',
    provenance: 'GLYPH INTERPRETATION · SOURCE PAGES 1 AND 4',
    pageNumber: 4,
    evidenceId: null,
  },
  {
    id: 'bottom-line',
    title: 'Bottom line',
    body: 'K3 combines 2.8T total parameters with 16-of-896 expert activation. The claimed 2.5× scaling gain remains an author claim pending fuller technical evidence.',
    provenance: 'GLYPH SYNTHESIS · SOURCE PAGE 4',
    pageNumber: 4,
    evidenceId: 'evidence-routing',
  },
] as const

export const kimiKeyFinding = {
  label: 'Key finding from the source',
  text: '“Kimi K3 is a 2.8T-parameter model built on our Kimi Delta Attention and Attention Residuals.”',
  source: 'Page 1 · Kimi K3 launch post',
  pageNumber: 1,
  evidenceId: 'evidence-model-scale',
} as const

export const kimiEvidenceMappings = {
  'evidence-model-scale': {
    number: 1,
    pageNumber: 1,
    exactText:
      'Kimi K3 is a\n2.8T-parameter model built on our Kimi Delta Attention and Attention\nResiduals, with native vision capabilities and a 1-million-token context\nwindow.',
    boxes: [
      { x: 0.743874, y: 0.618965, width: 0.117051, height: 0.011964 },
      { x: 0.108114, y: 0.643908, width: 0.699539, height: 0.015371 },
      { x: 0.108822, y: 0.668851, width: 0.693817, height: 0.015371 },
      { x: 0.107257, y: 0.693794, width: 0.080534, height: 0.011964 },
    ],
  },
  'evidence-routing': {
    number: 2,
    pageNumber: 4,
    exactText:
      'Mixture of Experts (MoE) sparsity, effectively activating 16 out of 896 experts\nwhen paired with a Stable LatentMoE framework. Together with refined\ntraining and data recipes, these structural changes yield an approximate 2.5×\nimprovement in overall scaling efficiency compared to Kimi K2',
    boxes: [
      { x: 0.108822, y: 0.512848, width: 0.772916, height: 0.016583 },
      { x: 0.107257, y: 0.538791, width: 0.717905, height: 0.015583 },
      { x: 0.107557, y: 0.563734, width: 0.773966, height: 0.015583 },
      { x: 0.108586, y: 0.588677, width: 0.625092, height: 0.015583 },
    ],
  },
} as const

export const kimiConcepts = [
  {
    id: 'moe',
    title: 'Sparse Mixture of Experts (MoE)',
    body: 'K3 stores 896 experts and activates 16 per token, reducing arithmetic per token while retaining a very large total parameter capacity. The full expert set still creates memory and networking requirements.',
    source: 'Source page 4',
    pageNumber: 4,
  },
  {
    id: 'kda',
    title: 'Kimi Delta Attention (KDA)',
    body: 'Moonshot describes KDA as a linear-attention mechanism designed to improve information flow across sequence length. The supplied report explains it as a fixed-size editable memory rather than a cache that grows with every token.',
    source: 'Source pages 1, 4, 5, and 15',
    pageNumber: 5,
  },
  {
    id: 'attnres',
    title: 'Attention Residuals (AttnRes)',
    body: 'AttnRes changes information flow across model depth by allowing later layers to retrieve selected earlier representations instead of relying only on one accumulated residual stream.',
    source: 'Source pages 4, 5, and 15',
    pageNumber: 5,
  },
  {
    id: 'quantization',
    title: 'Quantization-aware training',
    body: 'The report connects K3’s low-precision formats to reduced memory movement and a broader serving-hardware envelope. The source discusses the MXFP4 and MXFP8 formats on page 16.',
    source: 'Source page 16',
    pageNumber: 16,
  },
] as const

export const kimiEvidenceRegister = [
  {
    id: 'evidence-model-scale',
    kind: 'AUTHOR CLAIM',
    status: 'SUPPORTED IN SOURCE',
    text: 'Kimi K3 has 2.8T parameters, uses KDA and AttnRes, includes native vision, and supports a 1-million-token context window.',
    limitation:
      'This establishes what Moonshot announced, not independent performance validation.',
    pageNumber: 1,
    evidenceId: 'evidence-model-scale',
  },
  {
    id: 'evidence-routing',
    kind: 'AUTHOR CLAIM',
    status: 'SUPPORTED IN SOURCE',
    text: 'Moonshot says the model activates 16 of 896 experts and claims an approximate 2.5× improvement in overall scaling efficiency versus Kimi K2.',
    limitation:
      'The supplied launch post does not decompose the contribution of each architectural change.',
    pageNumber: 4,
    evidenceId: 'evidence-routing',
  },
  {
    id: 'evidence-frontier',
    kind: 'GLYPH INTERPRETATION',
    status: 'INSUFFICIENT EVIDENCE',
    text: 'The source alone cannot establish that K3’s efficiency mechanisms retain their reported benefits at full production scale.',
    limitation:
      'Independent benchmarks, serving measurements, and the promised technical report remain necessary.',
    pageNumber: 3,
    evidenceId: null,
  },
] as const

export const kimiArchitectureVisual: VisualSpec = {
  schemaVersion: 1,
  id: 'kimi-k3-architecture-glance',
  title: 'Kimi K3 architecture at a glance',
  purpose:
    'Show the four disclosed architectural elements without adding unsupported numerical relationships.',
  nodes: [
    {
      id: 'context',
      label: 'Long context',
      kind: 'INPUT',
      value: null,
      unit: null,
    },
    {
      id: 'kda-attnres',
      label: 'KDA + AttnRes',
      kind: 'PROCESS',
      value: null,
      unit: null,
    },
    {
      id: 'expert-routing',
      label: 'Sparse experts',
      kind: 'PROCESS',
      value: null,
      unit: null,
    },
    {
      id: 'model-output',
      label: 'Model output',
      kind: 'OUTPUT',
      value: null,
      unit: null,
    },
  ],
  edges: [
    {
      id: 'context-to-attention',
      from: 'context',
      to: 'kda-attnres',
      label: null,
      kind: 'FLOW',
    },
    {
      id: 'attention-to-experts',
      from: 'kda-attnres',
      to: 'expert-routing',
      label: null,
      kind: 'FLOW',
    },
    {
      id: 'experts-to-output',
      from: 'expert-routing',
      to: 'model-output',
      label: null,
      kind: 'FLOW',
    },
  ],
  groups: [],
  claimIds: ['kimi-claim-architecture'],
  evidenceSpanIds: ['kimi-source-page-4'],
  layout: 'LEFT_TO_RIGHT',
}
